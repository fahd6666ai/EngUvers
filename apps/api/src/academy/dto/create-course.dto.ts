import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleAr!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titleEn!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summaryAr!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summaryEn!: string;

  @IsString()
  disciplineTag!: string;

  @IsEnum(CourseLevel)
  level!: CourseLevel;
}
