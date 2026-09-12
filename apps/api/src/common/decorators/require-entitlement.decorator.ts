import { SetMetadata } from '@nestjs/common';
import type { EntitlementFeature } from '@enguvers/types';

export const REQUIRE_ENTITLEMENT_KEY = 'requireEntitlement';

/**
 * Gates a route behind `EntitlementsService.can(userId, feature)`, enforced
 * by EntitlementsGuard. No route uses this yet in Phase 1 — the mechanism
 * is built now so Phase 2+ feature routes (circuit lab, academy, exams,
 * ...) gate through this instead of an ad-hoc `plan === 'x'` check.
 */
export const RequireEntitlement = (feature: EntitlementFeature) =>
  SetMetadata(REQUIRE_ENTITLEMENT_KEY, feature);
