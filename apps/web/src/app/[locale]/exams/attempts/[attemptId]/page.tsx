'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Card } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AttemptAnswer {
  id: string;
  isCorrect: boolean;
  question: { id: string; textAr: string; textEn: string; points: number };
  selectedOption: { id: string; textAr: string; textEn: string } | null;
}

interface AttemptDetail {
  id: string;
  score: number | null;
  totalPoints: number;
  exam: { titleAr: string; titleEn: string };
  answers: AttemptAnswer[];
}

export default function ExamAttemptReviewPage() {
  const t = useTranslations('exams');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    apiClient.get<AttemptDetail>(`/exams/attempts/${attemptId}`).then(setAttempt, (err) => {
      if (err instanceof ApiError) setNotFound(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('notFound')}</Card>
      </main>
    );
  }

  if (!attempt) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {locale === 'ar' ? attempt.exam.titleAr : attempt.exam.titleEn}
        </h1>
        <Badge variant="success">
          {attempt.score}/{attempt.totalPoints}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        {attempt.answers.map((answer, index) => (
          <Card key={answer.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {index + 1}.{' '}
                {locale === 'ar' ? answer.question.textAr : answer.question.textEn}
              </p>
              <Badge variant={answer.isCorrect ? 'success' : 'default'}>
                {answer.isCorrect ? t('correct') : t('incorrect')}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {answer.selectedOption
                ? locale === 'ar'
                  ? answer.selectedOption.textAr
                  : answer.selectedOption.textEn
                : t('noAnswer')}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}
