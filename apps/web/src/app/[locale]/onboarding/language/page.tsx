import { useTranslations } from 'next-intl';
import { Card } from '@enguvers/ui';
import { Link } from '@/i18n/navigation';

export default function OnboardingLanguagePage() {
  const t = useTranslations('onboarding.language');

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
        <p className="mb-8 text-sm text-slate-500">{t('subtitle')}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding/country"
            locale="ar"
            className="rounded-md border border-slate-300 px-4 py-3 text-lg font-medium hover:border-brand-500 dark:border-slate-700"
          >
            {t('arabic')}
          </Link>
          <Link
            href="/onboarding/country"
            locale="en"
            className="rounded-md border border-slate-300 px-4 py-3 text-lg font-medium hover:border-brand-500 dark:border-slate-700"
          >
            {t('english')}
          </Link>
        </div>
      </Card>
    </main>
  );
}
