'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Card, Input } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { setToken } from '@/lib/auth-token';
import { applyOnboardingDraft } from '@/lib/apply-onboarding-draft';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiClient.post<{ accessToken: string }>(
        '/auth/register',
        { email: formData.get('email'), password, locale },
        { auth: false },
      );
      setToken(result.accessToken);
      await applyOnboardingDraft();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">{t('register.title')}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input type="email" name="email" placeholder={t('email')} required />
          <Input type="password" name="password" placeholder={t('password')} minLength={8} required />
          <Input
            type="password"
            name="confirmPassword"
            placeholder={t('confirmPassword')}
            minLength={8}
            required
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {t('register.submit')}
          </Button>
        </form>

        <Button variant="secondary" className="mt-4 w-full" disabled title="Google OAuth not configured yet">
          {t('googleComingSoon')}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('register.haveAccount')}{' '}
          <Link href="/auth/login" className="font-medium text-brand-700 dark:text-brand-300">
            {t('register.loginLink')}
          </Link>
        </p>
      </Card>
    </main>
  );
}
