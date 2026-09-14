import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  titleAr!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  titleEn!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  authorName!: string;

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

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsUrl()
  fileUrl!: string;
}
