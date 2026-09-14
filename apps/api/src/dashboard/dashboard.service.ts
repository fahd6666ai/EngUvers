import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // A submitted attempt "passes" at 60% of its snapshotted totalPoints —
  // the same everyday LMS default, not something the brief pins down.
  private static readonly PASS_THRESHOLD = 0.6;

  async getDashboard(userId: string) {
    const [profile, skills, entitlements, completedCourseCount, submittedAttempts] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: { university: true, major: true },
      }),
      this.prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      this.entitlements.listActive(userId),
      this.prisma.courseEnrollment.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.examAttempt.findMany({
        where: { userId, submittedAt: { not: null } },
        select: { score: true, totalPoints: true },
      }),
    ]);

    const passedFirstExam = submittedAttempts.some(
      (a) => a.totalPoints > 0 && (a.score ?? 0) / a.totalPoints >= DashboardService.PASS_THRESHOLD,
    );

    return {
      profile,
      skills,
      entitlements: entitlements.map((e) => ({ planCode: e.plan.code, source: e.source, endsAt: e.endsAt })),
      // The brief's journey (Learn → Build → Test → Prove → Grow):
      // onboarding (Phase 1), completedFirstCourse (Phase 3, Engineering
      // Academy), and passedFirstExam (Phase 3, Engineering Exams) are
      // real. The rest turn true as their phase ships (Project Lab
      // compile-quota in Phase 2's remaining gaps, Portfolio/Career in
      // Phase 5) — not fabricated ahead of that.
      journeyProgress: {
        onboardingCompleted: !!profile,
        completedFirstCourse: completedCourseCount > 0,
        submittedFirstProject: false,
        passedFirstExam,
        publishedPortfolio: false,
        appliedToOpportunity: false,
      },
    };
  }
}
