import { Injectable, Logger } from '@nestjs/common';
import type { OtpProvider } from './otp-provider.interface';

/**
 * Dev-mode default: no SMS gateway is configured yet (deferred input, see
 * CLAUDE.md phase log), so the code is logged instead of sent. AuthService
 * also echoes the code back in the response outside production so phone
 * login is testable end-to-end without a real gateway — see
 * AuthService.requestOtp.
 */
@Injectable()
export class ConsoleOtpProvider implements OtpProvider {
  private readonly logger = new Logger(ConsoleOtpProvider.name);

  async send(phone: string, code: string): Promise<void> {
    this.logger.warn(`[dev-only, no SMS provider configured] OTP for ${phone}: ${code}`);
  }
}
