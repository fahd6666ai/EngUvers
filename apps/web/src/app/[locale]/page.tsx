import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Button } from '@enguvers/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';

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
      <header className="flex items-center justify-end gap-3 p-4">
        <LocaleSwitcher />
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-100">
          {t('comingSoonBadge')}
        </span>
        <h1 className="text-4xl font-bold sm:text-5xl">{t('heading')}</h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">{t('subheading')}</p>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t('journey')}</p>
        <Button size="lg">{t('cta')}</Button>
      </div>
    </main>
  );
}
