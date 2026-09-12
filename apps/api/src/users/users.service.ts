import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { university: true, major: true } }, country: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    if (dto.browseGenerally) {
      return this.prisma.profile.upsert({
        where: { userId },
        update: { universityId: null, majorId: null, studyYear: null },
        create: { userId },
      });
    }

    if (!dto.countryCode) {
      throw new BadRequestException('countryCode is required unless browseGenerally is set');
    }
    const country = await this.prisma.country.findUnique({ where: { code: dto.countryCode } });
    if (!country) throw new BadRequestException(`Unknown country code: ${dto.countryCode}`);

    await this.prisma.user.update({ where: { id: userId }, data: { countryId: country.id } });

    return this.prisma.profile.upsert({
      where: { userId },
      update: { universityId: dto.universityId, majorId: dto.majorId, studyYear: dto.studyYear },
      create: {
        userId,
        universityId: dto.universityId,
        majorId: dto.majorId,
        studyYear: dto.studyYear,
      },
    });
  }
}
