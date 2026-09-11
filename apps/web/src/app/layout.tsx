import type { ReactNode } from 'react';

// Root layout is a thin pass-through — locale-specific <html lang/dir> and
// the theme/i18n providers live in `app/[locale]/layout.tsx`. Next.js
// requires a root layout to exist even when every real route is nested
// under `[locale]`.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
