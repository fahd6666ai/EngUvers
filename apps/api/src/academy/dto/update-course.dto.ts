import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CourseLevel } from '@prisma/client';

export class UpdateCourseDto {
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
  @MaxLength(500)
  summaryAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summaryEn?: string;

  @IsOptional()
  @IsString()
  disciplineTag?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
