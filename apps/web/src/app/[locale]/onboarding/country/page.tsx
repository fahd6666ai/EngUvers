'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Card } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';
import { setOnboardingDraft } from '@/lib/onboarding-draft';

interface Country {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

export default function OnboardingCountryPage() {
  const t = useTranslations('onboarding.country');
  const locale = useLocale();
  const router = useRouter();
  const [countries, setCountries] = useState<Country[] | null>(null);

  useEffect(() => {
    apiClient.get<Country[]>('/academic/countries', { auth: false }).then(setCountries);
  }, []);

  function chooseCountry(country: Country) {
    setOnboardingDraft({ countryCode: country.code, countryId: country.id });
    router.push('/onboarding/academic');
  }

  function skip() {
    setOnboardingDraft({ browseGenerally: true });
    router.push('/auth/register');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
        <p className="mb-6 text-sm text-slate-500">{t('subtitle')}</p>

        {!countries ? (
          <p className="text-sm text-slate-500">{t('loading')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {countries.map((country) => (
              <button
                key={country.id}
                type="button"
                onClick={() => chooseCountry(country)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:border-brand-500 dark:border-slate-700"
              >
                {locale === 'ar' ? country.nameAr : country.nameEn}
              </button>
            ))}
          </div>
        )}

        <Button variant="ghost" className="mt-6 w-full" onClick={skip}>
          {t('skip')}
        </Button>
      </Card>
    </main>
  );
}
