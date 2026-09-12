import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AcademicService } from './academic.service';

@Public()
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('countries')
  countries() {
    return this.academicService.listCountries();
  }

  @Get('universities')
  universities(@Query('countryId') countryId?: string) {
    return this.academicService.listUniversities(countryId);
  }

  @Get('majors')
  majors(@Query('facultyId') facultyId?: string) {
    return this.academicService.listMajors(facultyId);
  }
}
