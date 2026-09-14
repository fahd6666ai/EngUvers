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
  ValidateIf,
} from 'class-validator';
import { LessonContentType } from '@prisma/client';

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleAr!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleEn!: string;

  @IsEnum(LessonContentType)
  contentType!: LessonContentType;

  @ValidateIf((dto: CreateLessonDto) => dto.contentType === 'video')
  @IsUrl()
  videoUrl?: string;

  @ValidateIf((dto: CreateLessonDto) => dto.contentType === 'article')
  @IsString()
  @MinLength(10)
  bodyAr?: string;

  @ValidateIf((dto: CreateLessonDto) => dto.contentType === 'article')
  @IsString()
  @MinLength(10)
  bodyEn?: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number;
}
