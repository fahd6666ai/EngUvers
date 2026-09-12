// The academic-onboarding flow (language -> country -> academic, brief
// §5) runs before the visitor has an account, but POST /me/onboarding
// requires one. This draft bridges the gap: pages write to it as the
// visitor moves through onboarding, and the auth pages flush it to the
// API right after a successful register/login, then clear it.
export interface OnboardingDraft {
  browseGenerally?: boolean;
  countryCode?: string;
  countryId?: string;
  universityId?: string;
  majorId?: string;
  studyYear?: number;
}

const STORAGE_KEY = 'eu_onboarding_draft';

export function getOnboardingDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return {};
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
}

export function setOnboardingDraft(patch: OnboardingDraft): void {
  if (typeof window === 'undefined') return;
  const next = { ...getOnboardingDraft(), ...patch };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOnboardingDraft(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
