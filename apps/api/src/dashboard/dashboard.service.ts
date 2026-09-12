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
    const [profile, skills, entitlements] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: { university: true, major: true },
      }),
      this.prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      this.entitlements.listActive(userId),
    ]);

    return {
      profile,
      skills,
      entitlements: entitlements.map((e) => ({ planCode: e.plan.code, source: e.source, endsAt: e.endsAt })),
      // The brief's journey (Learn → Build → Test → Prove → Grow): only the
      // first step is real in Phase 1. The rest turn true as their phase
      // ships (Academy/Exams in Phase 3, Project Lab in Phase 2, Portfolio
      // in Phase 5, Career in Phase 5) — not fabricated ahead of that.
      journeyProgress: {
        onboardingCompleted: !!profile,
        completedFirstCourse: false,
        submittedFirstProject: false,
        passedFirstExam: false,
        publishedPortfolio: false,
        appliedToOpportunity: false,
      },
    };
  }
}
