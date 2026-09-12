export const OTP_PROVIDER = Symbol('OTP_PROVIDER');

/**
 * Swappable like `LLMProvider`/`PaymentProvider` elsewhere in the plan —
 * swap `ConsoleOtpProvider` for a real SMS gateway adapter without
 * touching AuthService.
 */
export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}
