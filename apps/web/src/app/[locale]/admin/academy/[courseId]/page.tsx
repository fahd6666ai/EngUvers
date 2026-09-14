'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, Input, Select, Textarea } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AdminLesson {
  id: string;
  titleAr: string;
  titleEn: string;
  contentType: 'video' | 'article';
  videoUrl: string | null;
  bodyAr: string | null;
  bodyEn: string | null;
  order: number;
  durationMinutes: number | null;
}

interface AdminCourseDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  disciplineTag: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  published: boolean;
  lessons: AdminLesson[];
}

export default function AdminCourseEditPage() {
  const t = useTranslations('admin.academy');
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [contentType, setContentType] = useState<'video' | 'article'>('article');
  const [savingCourse, setSavingCourse] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiClient.get<AdminCourseDetail>(`/admin/academy/courses/${courseId}`).then(setCourse, (err) => {
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
    if (!course) return;
    setSavingCourse(true);
    apiClient
      .patch(`/admin/academy/courses/${courseId}`, { published: !course.published })
      .then(load)
      .finally(() => setSavingCourse(false));
  }

  function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const nextOrder = (course?.lessons.length ?? 0) + 1;
    setAddingLesson(true);
    apiClient
      .post(`/admin/academy/courses/${courseId}/lessons`, {
        titleAr: formData.get('titleAr'),
        titleEn: formData.get('titleEn'),
        contentType,
        videoUrl: contentType === 'video' ? formData.get('videoUrl') : undefined,
        bodyAr: contentType === 'article' ? formData.get('bodyAr') : undefined,
        bodyEn: contentType === 'article' ? formData.get('bodyEn') : undefined,
        order: nextOrder,
      })
      .then(() => {
        (event.target as HTMLFormElement).reset();
        load();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setAddingLesson(false));
  }

  function deleteLesson(lessonId: string) {
    apiClient.delete(`/admin/academy/lessons/${lessonId}`).then(load);
  }

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('forbidden')}</Card>
      </main>
    );
  }

  if (!course) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{course.titleEn}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={course.published ? 'success' : 'default'}>
            {course.published ? t('published') : t('draft')}
          </Badge>
          <Button size="sm" variant="secondary" disabled={savingCourse} onClick={togglePublished}>
            {course.published ? t('unpublish') : t('publish')}
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">{t('lessons')}</h2>
        {course.lessons.length === 0 ? (
          <p className="text-sm text-slate-500">{t('noLessons')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {course.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <span>
                  {lesson.order}. {lesson.titleEn} · {t(`contentTypes.${lesson.contentType}`)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => deleteLesson(lesson.id)}>
                  {t('deleteLesson')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">{t('addLesson')}</h2>
        <form onSubmit={addLesson} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {t('titleAr')}
            <Input name="titleAr" required dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('titleEn')}
            <Input name="titleEn" required dir="ltr" />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('contentType')}
            <Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'video' | 'article')}
            >
              <option value="article">{t('contentTypes.article')}</option>
              <option value="video">{t('contentTypes.video')}</option>
            </Select>
          </label>

          {contentType === 'video' ? (
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              {t('videoUrl')}
              <Input name="videoUrl" type="url" required dir="ltr" />
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                {t('bodyAr')}
                <Textarea name="bodyAr" required dir="rtl" />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                {t('bodyEn')}
                <Textarea name="bodyEn" required dir="ltr" />
              </label>
            </>
          )}

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={addingLesson} className="sm:col-span-2">
            {addingLesson ? t('creating') : t('addLesson')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
