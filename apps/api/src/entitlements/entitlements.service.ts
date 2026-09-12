import { Injectable } from '@nestjs/common';
import type { EntitlementFeature, PlanCode } from '@enguvers/types';
import type { EntitlementSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The single gate every feature route/UI check goes through — see
 * CLAUDE.md's "Entitlements" decision. No feature route calls `can()` yet
 * in Phase 1 (the gated features start in Phase 2+); this service and its
 * guard exist now so those routes never fall back to an ad-hoc
 * `plan === 'x'` check.
 */
@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async grantPlan(
    userId: string,
    planCode: PlanCode,
    source: EntitlementSource,
    endsAt?: Date,
  ) {
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { code: planCode } });
    return this.prisma.entitlement.create({
      data: { userId, planId: plan.id, source, endsAt, status: 'active' },
    });
  }

  async listActive(userId: string) {
    return this.prisma.entitlement.findMany({
      where: {
        userId,
        status: 'active',
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      include: { plan: true },
    });
  }

  /**
   * True when at least one of the user's active entitlements' plans
   * declares a `PlanLimit` row for `feature`. Quota consumption (how many
   * of today's `dailyQuota` uses remain) is enforced by the feature's own
   * module once that feature exists — this only answers "is this plan
   * allowed to use it at all".
   */
  async can(userId: string, feature: EntitlementFeature): Promise<boolean> {
    const active = await this.listActive(userId);
    if (active.length === 0) return false;

    const planIds = active.map((e) => e.planId);
    const limit = await this.prisma.planLimit.findFirst({
      where: { planId: { in: planIds }, feature },
    });
    return !!limit;
  }
}
