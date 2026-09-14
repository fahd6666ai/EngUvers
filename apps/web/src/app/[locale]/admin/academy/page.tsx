'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, Input, Select, Textarea } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AdminCourse {
  id: string;
  titleAr: string;
  titleEn: string;
  published: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
  _count: { lessons: number; enrollments: number };
}

const DISCIPLINE_TAGS = [
  'electrical',
  'mechanical',
  'mechatronics',
  'communications',
  'software',
  'it',
  'ai',
  'robotics',
] as const;

export default function AdminAcademyPage() {
  const t = useTranslations('admin.academy');
  const router = useRouter();
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    apiClient.get<AdminCourse[]>('/admin/academy/courses').then(setCourses, (err) => {
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        setForbidden(true);
      }
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

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    setCreating(true);
    apiClient
      .post('/admin/academy/courses', {
        titleAr: formData.get('titleAr'),
        titleEn: formData.get('titleEn'),
        summaryAr: formData.get('summaryAr'),
        summaryEn: formData.get('summaryEn'),
        disciplineTag: formData.get('disciplineTag'),
        level: formData.get('level'),
      })
      .then(() => {
        (event.target as HTMLFormElement).reset();
        load();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setCreating(false));
  }

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('forbidden')}</Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">{t('newCourse')}</h2>
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {t('titleAr')}
            <Input name="titleAr" required dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('titleEn')}
            <Input name="titleEn" required dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('summaryAr')}
            <Textarea name="summaryAr" required dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('summaryEn')}
            <Textarea name="summaryEn" required dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('disciplineTag')}
            <Select name="disciplineTag" defaultValue={DISCIPLINE_TAGS[0]}>
              {DISCIPLINE_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('level')}
            <Select name="level" defaultValue="beginner">
              <option value="beginner">{t('levels.beginner')}</option>
              <option value="intermediate">{t('levels.intermediate')}</option>
              <option value="advanced">{t('levels.advanced')}</option>
            </Select>
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={creating} className="sm:col-span-2">
            {creating ? t('creating') : t('create')}
          </Button>
        </form>
      </Card>

      {!courses ? null : courses.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/admin/academy/${course.id}`}>
              <Card className="flex items-center justify-between gap-3 transition hover:border-brand-500">
                <div>
                  <h3 className="font-medium">{course.titleEn}</h3>
                  <p className="text-xs text-slate-400">
                    {t('lessonCount', { count: course._count.lessons })} ·{' '}
                    {t('enrollmentCount', { count: course._count.enrollments })}
                  </p>
                </div>
                <Badge variant={course.published ? 'success' : 'default'}>
                  {course.published ? t('published') : t('draft')}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
