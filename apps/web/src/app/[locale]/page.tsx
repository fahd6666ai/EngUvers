import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Button } from '@enguvers/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { AuthNav } from '@/components/auth-nav';
import { Link } from '@/i18n/navigation';

const DISCIPLINES = [
  { icon: '⚡', key: 'electrical' },
  { icon: '⚙️', key: 'mechanical' },
  { icon: '🤖', key: 'mechatronics' },
  { icon: '📡', key: 'communications' },
  { icon: '💻', key: 'software' },
  { icon: '🖥️', key: 'it' },
  { icon: '🧠', key: 'ai' },
  { icon: '🦾', key: 'robotics' },
];

const JOURNEY_STEPS = ['discover', 'learn', 'build', 'prove', 'grow'] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations('landing');

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">{t('heading')}</span>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          <AuthNav />
        </div>
      </header>

      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-100">
          {t('heroBadge')}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold sm:text-5xl">{t('heading')}</h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">{t('subheading')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/onboarding/language">
            <Button size="lg">{t('ctaPrimary')}</Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary">
              {t('ctaSecondary')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('disciplinesTitle')}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {DISCIPLINES.map((d) => (
            <span
              key={d.key}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-800"
            >
              <span aria-hidden>{d.icon}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">{t('journeyTitle')}</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {JOURNEY_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                {index + 1}
              </span>
              <h3 className="font-semibold">{t(`journey.${step}.title`)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t(`journey.${step}.desc`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
