'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Card } from '@enguvers/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface Lesson {
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

interface CourseDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
}

interface Progress {
  enrolled: boolean;
  completedAt: string | null;
  completedLessonIds: string[];
}

export default function CourseDetailPage() {
  const t = useTranslations('academy');
  const locale = useLocale();
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadProgress = useCallback(() => {
    if (!getToken()) return;
    apiClient.get<Progress>(`/academy/courses/${courseId}/my-progress`).then(setProgress);
  }, [courseId]);

  useEffect(() => {
    apiClient
      .get<CourseDetail>(`/academy/courses/${courseId}`, { auth: false })
      .then(setCourse, () => setNotFound(true));
    loadProgress();
  }, [courseId, loadProgress]);

  function enroll() {
    if (!getToken()) {
      window.location.href = '/auth/login';
      return;
    }
    setEnrolling(true);
    apiClient
      .post(`/academy/courses/${courseId}/enroll`)
      .then(loadProgress)
      .finally(() => setEnrolling(false));
  }

  function completeLesson(lessonId: string) {
    apiClient
      .post(`/academy/lessons/${lessonId}/complete`)
      .then(loadProgress)
      .catch((err) => {
        if (err instanceof ApiError) window.alert(err.message);
      });
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('notFound')}</Card>
      </main>
    );
  }

  if (!course) return null;

  const isEnrolled = progress?.enrolled ?? false;
  const completedIds = new Set(progress?.completedLessonIds ?? []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? course.titleAr : course.titleEn}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {locale === 'ar' ? course.summaryAr : course.summaryEn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{t(`levels.${course.level}`)}</Badge>
          {progress?.completedAt && <Badge variant="success">{t('courseCompleted')}</Badge>}
        </div>
      </div>

      {!isEnrolled && (
        <Button onClick={enroll} disabled={enrolling} className="mb-6">
          {enrolling ? t('enrolling') : t('enroll')}
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {course.lessons.map((lesson) => {
          const isOpen = openLessonId === lesson.id;
          const isDone = completedIds.has(lesson.id);
          return (
            <Card key={lesson.id}>
              <button
                type="button"
                onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
                className="flex w-full items-center justify-between gap-3 text-start"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className={
                      isDone ? 'text-green-600 dark:text-green-400' : 'text-slate-300 dark:text-slate-700'
                    }
                    aria-hidden
                  >
                    ●
                  </span>
                  {locale === 'ar' ? lesson.titleAr : lesson.titleEn}
                </span>
                {lesson.durationMinutes && (
                  <span className="text-xs text-slate-400">
                    {t('minutes', { count: lesson.durationMinutes })}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mt-4 flex flex-col gap-3">
                  {lesson.contentType === 'video' && lesson.videoUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-950">
                      <iframe
                        src={lesson.videoUrl}
                        title={locale === 'ar' ? lesson.titleAr : lesson.titleEn}
                        className="h-full w-full border-0"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                      {locale === 'ar' ? lesson.bodyAr : lesson.bodyEn}
                    </p>
                  )}

                  {isEnrolled &&
                    (isDone ? (
                      <Badge variant="success">{t('lessonCompleted')}</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => completeLesson(lesson.id)}>
                        {t('markComplete')}
                      </Button>
                    ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
