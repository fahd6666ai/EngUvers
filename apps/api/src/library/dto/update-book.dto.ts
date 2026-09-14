import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  titleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  authorName?: string;

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
  @IsUrl()
  coverImageUrl?: string;

  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
