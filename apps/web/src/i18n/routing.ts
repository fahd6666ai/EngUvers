import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'en'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'ar';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const localeDirection: Record<AppLocale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};
