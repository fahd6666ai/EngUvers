'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Card, Input, Select } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';
import { getOnboardingDraft, setOnboardingDraft } from '@/lib/onboarding-draft';

interface University {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface Major {
  id: string;
  nameAr: string;
  nameEn: string;
  disciplineTag: string;
}

export default function OnboardingAcademicPage() {
  const t = useTranslations('onboarding.academic');
  const locale = useLocale();
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  useEffect(() => {
    const draft = getOnboardingDraft();
    const query = draft.countryId ? `?countryId=${draft.countryId}` : '';
    apiClient.get<University[]>(`/academic/universities${query}`, { auth: false }).then(setUniversities);
    apiClient.get<Major[]>('/academic/majors', { auth: false }).then(setMajors);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const universityId = String(formData.get('universityId') || '') || undefined;
    const majorId = String(formData.get('majorId') || '') || undefined;
    const studyYearRaw = formData.get('studyYear');
    setOnboardingDraft({
      universityId,
      majorId,
      studyYear: studyYearRaw ? Number(studyYearRaw) : undefined,
    });
    router.push('/auth/register');
  }

  function skip() {
    router.push('/auth/register');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
        <p className="mb-6 text-sm text-slate-500">{t('subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('universityLabel')}
            <Select name="universityId" defaultValue="">
              <option value="">{t('noUniversity')}</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {locale === 'ar' ? uni.nameAr : uni.nameEn}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            {t('majorLabel')}
            <Select name="majorId" defaultValue="">
              <option value="">{t('chooseMajor')}</option>
              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {locale === 'ar' ? major.nameAr : major.nameEn}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            {t('studyYearLabel')}
            <Input type="number" name="studyYear" min={1} max={7} />
          </label>

          <Button type="submit">{t('finish')}</Button>
          <Button type="button" variant="ghost" onClick={skip}>
            {t('skip')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
