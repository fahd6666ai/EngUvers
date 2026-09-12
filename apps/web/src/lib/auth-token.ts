// Token storage: localStorage for client fetches, plus a plain (readable)
// cookie so middleware.ts can do a presence check for route protection.
// The cookie is NOT the security boundary — every request is still
// authorized server-side by the API's JwtAuthGuard; this only avoids a
// flash of protected UI before redirecting an unauthenticated visitor.
const STORAGE_KEY = 'eu_token';
const COOKIE_NAME = 'eu_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, token);
  const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days, matches the API's default JWT_EXPIRES_IN
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
