import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  listCountries() {
    return this.prisma.country.findMany({ orderBy: { nameEn: 'asc' } });
  }

  listUniversities(countryId?: string) {
    return this.prisma.university.findMany({
      where: countryId ? { countryId } : undefined,
      include: { faculties: true },
      orderBy: { nameEn: 'asc' },
    });
  }

  /**
   * `facultyId` scopes to one university's faculty; omitting it returns the
   * generic (no-faculty) majors — the discipline list from the brief
   * (electrical, mechanical, mechatronics, ...) that "browse generally"
   * and university-less onboarding both use.
   */
  listMajors(facultyId?: string) {
    return this.prisma.major.findMany({
      where: { facultyId: facultyId ?? null },
      orderBy: { nameEn: 'asc' },
    });
  }
}
