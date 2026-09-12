import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { OTP_PROVIDER, type OtpProvider } from './otp/otp-provider.interface';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly entitlements: EntitlementsService,
    @Inject(OTP_PROVIDER) private readonly otpProvider: OtpProvider,
  ) {}

  private issueToken(user: { id: string; role: string }) {
    return this.jwt.sign({ sub: user.id, role: user.role });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, locale: dto.locale ?? 'ar' },
    });
    await this.entitlements.grantPlan(user.id, 'free', 'subscription');

    return { accessToken: this.issueToken(user), user: this.toPublicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { accessToken: this.issueToken(user), user: this.toPublicUser(user) };
  }

  async requestOtp(phone: string) {
    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.phoneOtp.create({
      data: { phone, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000) },
    });
    await this.otpProvider.send(phone, code);

    const isProduction = process.env.NODE_ENV === 'production';
    return {
      sent: true,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      // Dev convenience only — see ConsoleOtpProvider. Never present once a
      // real SMS gateway is wired in, regardless of NODE_ENV.
      ...(isProduction ? {} : { devCode: code }),
    };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.prisma.phoneOtp.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('No valid verification code for this number');
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 }, consumedAt: matches ? new Date() : undefined },
    });
    if (!matches) {
      throw new UnauthorizedException('Incorrect verification code');
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      user = await this.prisma.user.create({ data: { phone, locale: 'ar' } });
      isNewUser = true;
    }
    if (isNewUser) {
      await this.entitlements.grantPlan(user.id, 'free', 'subscription');
    }

    return { accessToken: this.issueToken(user), user: this.toPublicUser(user), isNewUser };
  }

  private toPublicUser(user: { id: string; email: string | null; phone: string | null; role: string; locale: string }) {
    return { id: user.id, email: user.email, phone: user.phone, role: user.role, locale: user.locale };
  }
}
