'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { setToken } from '@/lib/auth-token';
import { applyOnboardingDraft } from '@/lib/apply-onboarding-draft';

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await apiClient.post<{ accessToken: string }>(
        '/auth/otp/verify',
        { phone, code: formData.get('code') },
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
        <h1 className="mb-2 text-2xl font-bold">{t('otpCode')}</h1>
        <p className="mb-6 text-sm text-slate-500" dir="ltr">
          {phone}
        </p>
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <Input
            type="text"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder={t('otpCode')}
            required
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {t('verifyOtp')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
