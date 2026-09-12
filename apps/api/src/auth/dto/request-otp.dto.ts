import { Matches } from 'class-validator';

export class RequestOtpDto {
  // E.164-ish: leading + then 8-15 digits. Real validation (country-aware
  // formatting) belongs to whichever real SMS provider replaces the
  // dev-mode one.
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format, e.g. +9665xxxxxxxx' })
  phone!: string;
}
