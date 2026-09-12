'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { clearToken, getToken } from '@/lib/auth-token';

interface CircuitProjectSummary {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export default function ProjectLabPage() {
  const t = useTranslations('lab');
  const router = useRouter();
  const [projects, setProjects] = useState<CircuitProjectSummary[] | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    apiClient.get<CircuitProjectSummary[]>('/circuit-projects').then(setProjects, (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace('/auth/login');
      }
    });
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/lab/circuits/new">
          <Button>{t('newProject')}</Button>
        </Link>
      </div>

      {!projects ? null : projects.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/lab/circuits/${project.id}`}>
              <Card className="transition hover:border-brand-500">
                <h2 className="font-semibold">{project.name}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(project.updatedAt).toLocaleString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
