import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';

/**
 * Either `browseGenerally: true` (brief §5's "تصفح عام" path — no
 * university/major tie-in) or a country + optionally
 * university/major/studyYear. All academic fields are optional even in
 * the non-generic path so a student who only knows their country can
 * still finish onboarding and fill in the rest later from settings.
 */
export class OnboardingDto {
  @IsOptional()
  @IsBoolean()
  browseGenerally?: boolean;

  @ValidateIf((o) => !o.browseGenerally)
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  universityId?: string;

  @IsOptional()
  @IsString()
  majorId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  studyYear?: number;
}
