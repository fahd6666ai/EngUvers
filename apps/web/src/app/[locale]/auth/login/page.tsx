'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Input } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { setToken } from '@/lib/auth-token';
import { applyOnboardingDraft } from '@/lib/apply-onboarding-draft';

type Tab = 'email' | 'phone';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('email');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await apiClient.post<{ accessToken: string }>(
        '/auth/login',
        { email: formData.get('email'), password: formData.get('password') },
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

  async function handlePhoneRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get('phone') ?? '');
    try {
      await apiClient.post('/auth/otp/request', { phone }, { auth: false });
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">{t('login.title')}</h1>

        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`border-b-2 px-3 pb-2 text-sm font-medium ${tab === 'email' ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500'}`}
          >
            {t('emailTab')}
          </button>
          <button
            type="button"
            onClick={() => setTab('phone')}
            className={`border-b-2 px-3 pb-2 text-sm font-medium ${tab === 'phone' ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500'}`}
          >
            {t('phoneTab')}
          </button>
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <Input type="email" name="email" placeholder={t('email')} required />
            <Input type="password" name="password" placeholder={t('password')} minLength={8} required />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {t('login.submit')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneRequestOtp} className="flex flex-col gap-4">
            <Input type="tel" name="phone" placeholder={t('phone')} required />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {t('requestOtp')}
            </Button>
          </form>
        )}

        <Button variant="secondary" className="mt-4 w-full" disabled title="Google OAuth not configured yet">
          {t('googleComingSoon')}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('login.noAccount')}{' '}
          <Link href="/auth/register" className="font-medium text-brand-700 dark:text-brand-300">
            {t('login.registerLink')}
          </Link>
        </p>
      </Card>
    </main>
  );
}
