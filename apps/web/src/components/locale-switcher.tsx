'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{t('label')}</span>
      <select
        className="rounded-md border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-700"
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {l === 'ar' ? 'العربية' : 'English'}
          </option>
        ))}
      </select>
    </label>
  );
}
