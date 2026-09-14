import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  disciplineTag?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
