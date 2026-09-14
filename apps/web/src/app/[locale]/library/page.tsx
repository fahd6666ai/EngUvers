'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@enguvers/ui';
import { Link } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';

interface BookSummary {
  id: string;
  titleAr: string;
  titleEn: string;
  authorName: string;
  descriptionAr: string;
  descriptionEn: string;
  disciplineTag: string;
  coverImageUrl: string | null;
}

export default function LibraryCatalogPage() {
  const t = useTranslations('library');
  const locale = useLocale();
  const [books, setBooks] = useState<BookSummary[] | null>(null);

  useEffect(() => {
    apiClient.get<BookSummary[]>('/library/books', { auth: false }).then(setBooks);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {!books ? null : books.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((book) => (
            <Link key={book.id} href={`/library/${book.id}`}>
              <Card className="flex h-full gap-3 transition hover:border-brand-500">
                {book.coverImageUrl && (
                  // Admin-provided cover URLs, not user uploads — next/image's
                  // remote-pattern allowlist isn't configured for this yet.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverImageUrl}
                    alt=""
                    className="h-24 w-16 flex-none rounded object-cover"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold">{locale === 'ar' ? book.titleAr : book.titleEn}</h2>
                  <p className="text-xs text-slate-400">{book.authorName}</p>
                  <p className="line-clamp-2 text-sm text-slate-500">
                    {locale === 'ar' ? book.descriptionAr : book.descriptionEn}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
