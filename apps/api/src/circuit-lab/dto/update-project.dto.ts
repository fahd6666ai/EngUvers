import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  // The .vlx payload is Velxio's own JSON shape (see starter-project.ts's
  // header comment) — validated loosely here (must be an object; Velxio's
  // own frontend already validates the format/version fields on load, see
  // vlxFile.ts's validatePayload).
  @IsOptional()
  @IsObject()
  vlxContent?: Record<string, unknown>;
}
