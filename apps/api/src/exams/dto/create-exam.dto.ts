import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExamDto {
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
  @MaxLength(2000)
  descriptionAr!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  descriptionEn!: string;

  @IsString()
  disciplineTag!: string;
}
