import { apiClient } from './api-client';
import { getOnboardingDraft, clearOnboardingDraft } from './onboarding-draft';

/** Called right after a successful register/login/OTP-verify. */
export async function applyOnboardingDraft(): Promise<void> {
  const draft = getOnboardingDraft();
  const hasContent = draft.browseGenerally || draft.countryCode;
  if (!hasContent) return;

  try {
    await apiClient.post('/me/onboarding', {
      browseGenerally: draft.browseGenerally,
      countryCode: draft.countryCode,
      universityId: draft.universityId,
      majorId: draft.majorId,
      studyYear: draft.studyYear,
    });
  } finally {
    clearOnboardingDraft();
  }
}
