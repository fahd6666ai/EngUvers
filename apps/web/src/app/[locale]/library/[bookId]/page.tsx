'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Card } from '@enguvers/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface BookDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  authorName: string;
  descriptionAr: string;
  descriptionEn: string;
  disciplineTag: string;
  coverImageUrl: string | null;
}

export default function BookDetailPage() {
  const t = useTranslations('library');
  const locale = useLocale();
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<BookDetail>(`/library/books/${bookId}`, { auth: false })
      .then(setBook, () => setNotFound(true));
  }, [bookId]);

  function openBook() {
    if (!getToken()) {
      window.location.href = '/auth/login';
      return;
    }
    setError(null);
    setOpening(true);
    apiClient
      .get<{ fileUrl: string }>(`/library/books/${bookId}/access`)
      .then((res) => window.open(res.fileUrl, '_blank', 'noopener,noreferrer'))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('errors.generic')))
      .finally(() => setOpening(false));
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('notFound')}</Card>
      </main>
    );
  }

  if (!book) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row">
        {book.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt=""
            className="h-48 w-32 flex-none self-start rounded object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? book.titleAr : book.titleEn}</h1>
          <p className="mt-1 text-sm text-slate-400">{book.authorName}</p>
          <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
            {locale === 'ar' ? book.descriptionAr : book.descriptionEn}
          </p>

          <Button onClick={openBook} disabled={opening} className="mt-6">
            {opening ? t('opening') : t('openBook')}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
