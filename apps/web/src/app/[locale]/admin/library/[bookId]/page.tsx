'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AdminBookDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  authorName: string;
  descriptionAr: string;
  descriptionEn: string;
  disciplineTag: string;
  fileUrl: string;
  published: boolean;
}

export default function AdminBookEditPage() {
  const t = useTranslations('admin.library');
  const router = useRouter();
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;

  const [book, setBook] = useState<AdminBookDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function load() {
    apiClient.get<AdminBookDetail>(`/admin/library/books/${bookId}`).then(setBook, (err) => {
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
    if (!book) return;
    setSaving(true);
    apiClient
      .patch(`/admin/library/books/${bookId}`, { published: !book.published })
      .then(load)
      .finally(() => setSaving(false));
  }

  function deleteBook() {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(true);
    apiClient
      .delete(`/admin/library/books/${bookId}`)
      .then(() => router.push('/admin/library'))
      .finally(() => setDeleting(false));
  }

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('forbidden')}</Card>
      </main>
    );
  }

  if (!book) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{book.titleEn}</h1>
          <p className="text-sm text-slate-400">{book.authorName}</p>
        </div>
        <Badge variant={book.published ? 'success' : 'default'}>
          {book.published ? t('published') : t('draft')}
        </Badge>
      </div>

      <Card className="flex flex-col gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{book.descriptionEn}</p>
        <p className="break-all text-xs text-slate-400">{book.fileUrl}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={saving} onClick={togglePublished}>
            {book.published ? t('unpublish') : t('publish')}
          </Button>
          <Button size="sm" variant="ghost" disabled={deleting} onClick={deleteBook}>
            {t('deleteBook')}
          </Button>
        </div>
      </Card>
    </main>
  );
}
