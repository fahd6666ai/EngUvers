import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getDashboard(userId: string) {
    const [profile, skills, entitlements, completedCourseCount] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: { university: true, major: true },
      }),
      this.prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      this.entitlements.listActive(userId),
      this.prisma.courseEnrollment.count({ where: { userId, completedAt: { not: null } } }),
    ]);

    return {
      profile,
      skills,
      entitlements: entitlements.map((e) => ({ planCode: e.plan.code, source: e.source, endsAt: e.endsAt })),
      // The brief's journey (Learn → Build → Test → Prove → Grow):
      // onboarding (Phase 1) and completedFirstCourse (Phase 3, Engineering
      // Academy) are real. The rest turn true as their phase ships
      // (Project Lab compile-quota in Phase 2's remaining gaps, Exams in
      // Phase 3's next slice, Portfolio/Career in Phase 5) — not fabricated
      // ahead of that.
      journeyProgress: {
        onboardingCompleted: !!profile,
        completedFirstCourse: completedCourseCount > 0,
        submittedFirstProject: false,
        passedFirstExam: false,
        publishedPortfolio: false,
        appliedToOpportunity: false,
      },
    };
  }
}
