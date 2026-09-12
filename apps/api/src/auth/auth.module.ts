import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OTP_PROVIDER } from './otp/otp-provider.interface';
import { ConsoleOtpProvider } from './otp/console-otp.provider';

@Module({
  controllers: [AuthController],
  providers: [AuthService, { provide: OTP_PROVIDER, useClass: ConsoleOtpProvider }],
})
export class AuthModule {}
