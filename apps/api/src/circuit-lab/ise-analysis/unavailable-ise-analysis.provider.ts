import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { IseAnalysisProvider, IseAnalysisResult } from './ise-analysis-provider.interface';

/**
 * Dev-mode default — plays the same role ConsoleOtpProvider plays for
 * OtpProvider. Engineering AI analysis needs services/ai (still a
 * placeholder) and an ANTHROPIC_API_KEY (a deferred input — see CLAUDE.md's
 * Phase Log), neither of which exist yet, so this fails loudly and
 * specifically instead of fabricating an explanation. Swap for a real
 * provider once both land; nothing above this seam (the controller,
 * the entitlement gate, the web button) needs to change.
 */
@Injectable()
export class UnavailableIseAnalysisProvider implements IseAnalysisProvider {
  async explainProject(): Promise<IseAnalysisResult> {
    throw new ServiceUnavailableException(
      'Engineering AI project analysis is not configured yet — it needs services/ai and an ANTHROPIC_API_KEY (see CLAUDE.md, Phase 4).',
    );
  }
}
