export const ISE_ANALYSIS_PROVIDER = Symbol('ISE_ANALYSIS_PROVIDER');

export interface IseAnalysisResult {
  summary: string;
}

/**
 * Swappable-provider seam for Engineering AI (ISE) project analysis — same
 * shape as `OtpProvider` (see auth/otp/otp-provider.interface.ts): a DI
 * token + interface, with a placeholder default (UnavailableIseAnalysisProvider)
 * until services/ai and an ANTHROPIC_API_KEY exist. Gated behind the
 * `ise.analysis` EntitlementFeature (packages/types) via
 * `@RequireEntitlement` + `EntitlementsGuard` on the controller route, same
 * as every other feature gate.
 */
export interface IseAnalysisProvider {
  explainProject(vlxContent: unknown): Promise<IseAnalysisResult>;
}
