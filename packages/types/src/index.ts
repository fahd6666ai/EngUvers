// Shared domain types for EngUvers apps/services.
// Keep this package framework-agnostic (no React/Nest/Prisma imports) so
// both apps/web and apps/api can depend on it without pulling the other's
// runtime.

export type Locale = 'ar' | 'en';

export type Role = 'student' | 'engineer' | 'instructor' | 'company' | 'university' | 'admin';

export type PlanCode = 'free' | 'student_pro' | 'engineer_pro' | 'university' | 'enterprise';

export type EntitlementSource = 'subscription' | 'voucher' | 'admin_grant';

export type EntitlementStatus = 'active' | 'expired' | 'revoked';

/**
 * Feature flags gated by the central Entitlements system. Every route/UI
 * check goes through `entitlements.can(userId, feature)` — never a raw
 * `plan === 'x'` comparison scattered in feature code.
 */
export type EntitlementFeature =
  | 'circuit_lab.arduino'
  | 'circuit_lab.pico'
  | 'circuit_lab.esp32'
  | 'circuit_lab.electrical_sim'
  | 'academy.courses'
  | 'library.books'
  | 'exams.full_bank'
  | 'ai.tutor'
  | 'ise.analysis'
  | 'career.ai_interview';

export interface PlanLimit {
  planCode: PlanCode;
  feature: EntitlementFeature;
  dailyQuota: number | null; // null = unlimited
}
