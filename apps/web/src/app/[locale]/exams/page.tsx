'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Card } from '@enguvers/ui';
import { Link } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface ExamSummary {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  disciplineTag: string;
  _count: { questions: number };
}

interface MyAttempt {
  id: string;
  submittedAt: string | null;
  score: number | null;
  totalPoints: number;
  exam: { id: string; titleAr: string; titleEn: string };
}

export default function ExamsCatalogPage() {
  const t = useTranslations('exams');
  const locale = useLocale();
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [attempts, setAttempts] = useState<MyAttempt[] | null>(null);

  useEffect(() => {
    apiClient.get<ExamSummary[]>('/exams', { auth: false }).then(setExams);
    if (getToken()) {
      apiClient.get<MyAttempt[]>('/exams/me/attempts').then(setAttempts);
    }
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {!exams ? null : exams.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/exams/${exam.id}`}>
              <Card className="flex h-full flex-col gap-2 transition hover:border-brand-500">
                <h2 className="font-semibold">{locale === 'ar' ? exam.titleAr : exam.titleEn}</h2>
                <p className="text-sm text-slate-500">
                  {locale === 'ar' ? exam.descriptionAr : exam.descriptionEn}
                </p>
                <p className="mt-auto text-xs text-slate-400">
                  {t('questionCount', { count: exam._count.questions })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {attempts && attempts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">{t('myAttempts')}</h2>
          <div className="flex flex-col gap-2">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {locale === 'ar' ? attempt.exam.titleAr : attempt.exam.titleEn}
                </span>
                {attempt.submittedAt ? (
                  <Link href={`/exams/attempts/${attempt.id}`}>
                    <Badge variant="success">
                      {attempt.score}/{attempt.totalPoints}
                    </Badge>
                  </Link>
                ) : (
                  <Badge>{t('inProgress')}</Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
