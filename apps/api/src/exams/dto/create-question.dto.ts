import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  textAr!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  textEn!: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  // Exactly one option must have isCorrect: true — checked in
  // ExamsService.createQuestion, not here (class-validator isn't a
  // natural fit for a "the array as a whole must satisfy X" rule).
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options!: CreateOptionDto[];
}
