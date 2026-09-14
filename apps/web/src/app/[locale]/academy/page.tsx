'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Card } from '@enguvers/ui';
import { Link } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';

interface CourseSummary {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  disciplineTag: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  _count: { lessons: number };
}

export default function AcademyCatalogPage() {
  const t = useTranslations('academy');
  const locale = useLocale();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);

  useEffect(() => {
    apiClient.get<CourseSummary[]>('/academy/courses', { auth: false }).then(setCourses);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {!courses ? null : courses.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Link key={course.id} href={`/academy/${course.id}`}>
              <Card className="flex h-full flex-col gap-2 transition hover:border-brand-500">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{locale === 'ar' ? course.titleAr : course.titleEn}</h2>
                  <Badge>{t(`levels.${course.level}`)}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {locale === 'ar' ? course.summaryAr : course.summaryEn}
                </p>
                <p className="mt-auto text-xs text-slate-400">
                  {t('lessonCount', { count: course._count.lessons })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
