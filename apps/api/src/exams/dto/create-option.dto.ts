import { IsBoolean, IsInt, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  textAr!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  textEn!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsInt()
  @Min(1)
  order!: number;
}
