'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, Input } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AdminOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order: number;
}

interface AdminQuestion {
  id: string;
  textAr: string;
  textEn: string;
  order: number;
  points: number;
  options: AdminOption[];
}

interface AdminExamDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  published: boolean;
  questions: AdminQuestion[];
}

// Fixed A-D option slots in the authoring form, rather than a fully
// dynamic add/remove list — covers the vast majority of MCQ questions
// while keeping the form simple. Empty slots (blank both text fields)
// are dropped before submit; at least 2 filled slots are required.
const OPTION_SLOTS = [0, 1, 2, 3];

export default function AdminExamEditPage() {
  const t = useTranslations('admin.exams');
  const router = useRouter();
  const params = useParams<{ examId: string }>();
  const examId = params.examId;

  const [exam, setExam] = useState<AdminExamDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [correctSlot, setCorrectSlot] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiClient.get<AdminExamDetail>(`/admin/exams/${examId}`).then(setExam, (err) => {
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) setForbidden(true);
    });
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePublished() {
    if (!exam) return;
    setSaving(true);
    apiClient
      .patch(`/admin/exams/${examId}`, { published: !exam.published })
      .then(load)
      .finally(() => setSaving(false));
  }

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const options = OPTION_SLOTS.map((slot) => ({
      textAr: String(formData.get(`optionAr${slot}`) || '').trim(),
      textEn: String(formData.get(`optionEn${slot}`) || '').trim(),
      slot,
    })).filter((o) => o.textAr && o.textEn);

    if (options.length < 2) {
      setError(t('errors.needTwoOptions'));
      return;
    }
    if (!options.some((o) => o.slot === correctSlot)) {
      setError(t('errors.correctOptionEmpty'));
      return;
    }

    const nextOrder = (exam?.questions.length ?? 0) + 1;
    setAddingQuestion(true);
    apiClient
      .post(`/admin/exams/${examId}/questions`, {
        textAr: formData.get('textAr'),
        textEn: formData.get('textEn'),
        order: nextOrder,
        options: options.map((o, i) => ({
          textAr: o.textAr,
          textEn: o.textEn,
          isCorrect: o.slot === correctSlot,
          order: i + 1,
        })),
      })
      .then(() => {
        (event.target as HTMLFormElement).reset();
        setCorrectSlot(0);
        load();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setAddingQuestion(false));
  }

  function deleteQuestion(questionId: string) {
    apiClient.delete(`/admin/exams/questions/${questionId}`).then(load);
  }

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('forbidden')}</Card>
      </main>
    );
  }

  if (!exam) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{exam.titleEn}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={exam.published ? 'success' : 'default'}>
            {exam.published ? t('published') : t('draft')}
          </Badge>
          <Button size="sm" variant="secondary" disabled={saving} onClick={togglePublished}>
            {exam.published ? t('unpublish') : t('publish')}
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">{t('questions')}</h2>
        {exam.questions.length === 0 ? (
          <p className="text-sm text-slate-500">{t('noQuestions')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {exam.questions.map((question) => (
              <li
                key={question.id}
                className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {question.order}. {question.textEn} ({question.points} pt)
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => deleteQuestion(question.id)}>
                    {t('deleteQuestion')}
                  </Button>
                </div>
                <ul className="mt-2 flex flex-col gap-1 ps-4 text-xs text-slate-500">
                  {question.options.map((option) => (
                    <li key={option.id} className={option.isCorrect ? 'font-medium text-green-600' : ''}>
                      {option.isCorrect ? '✓ ' : '— '}
                      {option.textEn}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">{t('addQuestion')}</h2>
        <form onSubmit={addQuestion} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {t('questionTextAr')}
            <Input name="textAr" required dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('questionTextEn')}
            <Input name="textEn" required dir="ltr" />
          </label>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm text-slate-500">{t('optionsHint')}</span>
            {OPTION_SLOTS.map((slot) => (
              <div key={slot} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctSlot"
                  checked={correctSlot === slot}
                  onChange={() => setCorrectSlot(slot)}
                  aria-label={t('correctOption')}
                />
                <Input name={`optionAr${slot}`} placeholder={t('optionAr', { n: slot + 1 })} dir="rtl" />
                <Input name={`optionEn${slot}`} placeholder={t('optionEn', { n: slot + 1 })} dir="ltr" />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={addingQuestion} className="sm:col-span-2">
            {addingQuestion ? t('creating') : t('addQuestion')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
