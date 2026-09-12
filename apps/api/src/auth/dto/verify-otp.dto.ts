import { Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format, e.g. +9665xxxxxxxx' })
  phone!: string;

  @Length(6, 6)
  code!: string;
}
