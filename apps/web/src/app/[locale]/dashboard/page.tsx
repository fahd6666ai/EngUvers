'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Card } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { clearToken, getToken } from '@/lib/auth-token';

interface DashboardData {
  profile: {
    displayName: string | null;
    university: { nameAr: string; nameEn: string } | null;
    major: { nameAr: string; nameEn: string } | null;
    studyYear: number | null;
  } | null;
  skills: { skill: { nameAr: string; nameEn: string }; level: number; points: number }[];
  entitlements: { planCode: string; source: string; endsAt: string | null }[];
  journeyProgress: Record<string, boolean>;
}

const JOURNEY_KEYS = [
  'onboardingCompleted',
  'completedFirstCourse',
  'submittedFirstProject',
  'passedFirstExam',
  'publishedPortfolio',
  'appliedToOpportunity',
] as const;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    apiClient.get<DashboardData>('/me/dashboard').then(setData, (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/auth/login');
      }
    });
  }, [router]);

  if (!data) return null;

  const planCode = data.entitlements[0]?.planCode ?? 'free';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t('welcome')}
            {data.profile?.displayName ? `, ${data.profile.displayName}` : ''}
          </h1>
          {data.profile?.university && (
            <p className="text-sm text-slate-500">
              {locale === 'ar' ? data.profile.university.nameAr : data.profile.university.nameEn}
              {data.profile.major &&
                ` · ${locale === 'ar' ? data.profile.major.nameAr : data.profile.major.nameEn}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('yourPlan')}</span>
          <Badge variant="brand">{planCode}</Badge>
          <Link href="/academy">
            <Button size="sm" variant="secondary">
              {t('openAcademy')}
            </Button>
          </Link>
          <Link href="/lab">
            <Button size="sm">{t('openLab')}</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">{t('journeyTitle')}</h2>
          <ul className="flex flex-col gap-2">
            {JOURNEY_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    data.journeyProgress[key]
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }
                  aria-hidden
                >
                  ●
                </span>
                <span className={data.journeyProgress[key] ? '' : 'text-slate-400'}>
                  {t(`journey.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">{t('skillsTitle')}</h2>
          {data.skills.length === 0 ? (
            <p className="text-sm text-slate-500">{t('skillsEmpty')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.skills.map((s, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{locale === 'ar' ? s.skill.nameAr : s.skill.nameEn}</span>
                  <Badge>{s.points}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
