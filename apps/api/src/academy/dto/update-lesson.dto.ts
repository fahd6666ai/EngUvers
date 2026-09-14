import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LessonContentType } from '@prisma/client';

export class UpdateLessonDto {
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
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bodyAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bodyEn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number;
}
