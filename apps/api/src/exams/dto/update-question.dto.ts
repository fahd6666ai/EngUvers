import { IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

// Text/order/points only — editing a question's options happens by
// deleting and recreating the question (see the "no per-option
// endpoints" decision in library/academy's admin controllers' sibling
// note). Acceptable at this scope: MVP content authoring, not a
// full editorial workflow.
export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  textAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  textEn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
}
