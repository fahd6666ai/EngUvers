'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Card } from '@enguvers/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface ExamMeta {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  _count: { questions: number };
}

interface AttemptOption {
  id: string;
  textAr: string;
  textEn: string;
  order: number;
}

interface AttemptQuestion {
  id: string;
  textAr: string;
  textEn: string;
  order: number;
  points: number;
  options: AttemptOption[];
}

interface StartResponse {
  attemptId: string;
  exam: { id: string; titleAr: string; titleEn: string };
  questions: AttemptQuestion[];
}

interface SubmitResult {
  score: number;
  totalPoints: number;
  correctCount: number;
  questionCount: number;
}

export default function ExamDetailPage() {
  const t = useTranslations('exams');
  const locale = useLocale();
  const params = useParams<{ examId: string }>();
  const examId = params.examId;

  const [exam, setExam] = useState<ExamMeta | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState<StartResponse | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ExamMeta>(`/exams/${examId}`, { auth: false })
      .then(setExam, () => setNotFound(true));
  }, [examId]);

  function startExam() {
    if (!getToken()) {
      window.location.href = '/auth/login';
      return;
    }
    setError(null);
    setStarting(true);
    apiClient
      .post<StartResponse>(`/exams/${examId}/start`)
      .then(setAttempt)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setStarting(false));
  }

  function selectOption(questionId: string, optionId: string) {
    setSelections((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function submitAttempt() {
    if (!attempt) return;
    setError(null);
    setSubmitting(true);
    apiClient
      .post<SubmitResult>(`/exams/attempts/${attempt.attemptId}/submit`, {
        answers: Object.entries(selections).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setSubmitting(false));
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('notFound')}</Card>
      </main>
    );
  }

  if (!exam) return null;

  if (result) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Card className="text-center">
          <h1 className="mb-2 text-xl font-bold">{t('resultTitle')}</h1>
          <p className="text-3xl font-bold">
            {result.score}/{result.totalPoints}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t('correctCount', { correct: result.correctCount, total: result.questionCount })}
          </p>
        </Card>
      </main>
    );
  }

  if (attempt) {
    const answeredCount = Object.keys(selections).length;
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-bold">
          {locale === 'ar' ? attempt.exam.titleAr : attempt.exam.titleEn}
        </h1>
        <div className="flex flex-col gap-4">
          {attempt.questions.map((question, index) => (
            <Card key={question.id}>
              <p className="mb-3 font-medium">
                {index + 1}. {locale === 'ar' ? question.textAr : question.textEn}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 text-sm has-[:checked]:font-medium"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={selections[question.id] === option.id}
                      onChange={() => selectOption(question.id, option.id)}
                    />
                    {locale === 'ar' ? option.textAr : option.textEn}
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <Button onClick={submitAttempt} disabled={submitting} className="mt-6">
          {submitting
            ? t('submitting')
            : t('submit', { answered: answeredCount, total: attempt.questions.length })}
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">{locale === 'ar' ? exam.titleAr : exam.titleEn}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {locale === 'ar' ? exam.descriptionAr : exam.descriptionEn}
      </p>
      <Badge className="mt-3">{t('questionCount', { count: exam._count.questions })}</Badge>

      <Button onClick={startExam} disabled={starting} className="mt-6 block">
        {starting ? t('starting') : t('startExam')}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </main>
  );
}
