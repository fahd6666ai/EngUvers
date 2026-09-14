'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, Input, Select, Textarea } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

interface AdminBook {
  id: string;
  titleAr: string;
  titleEn: string;
  authorName: string;
  published: boolean;
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

export default function AdminLibraryPage() {
  const t = useTranslations('admin.library');
  const router = useRouter();
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    apiClient.get<AdminBook[]>('/admin/library/books').then(setBooks, (err) => {
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
      .post('/admin/library/books', {
        titleAr: formData.get('titleAr'),
        titleEn: formData.get('titleEn'),
        authorName: formData.get('authorName'),
        descriptionAr: formData.get('descriptionAr'),
        descriptionEn: formData.get('descriptionEn'),
        disciplineTag: formData.get('disciplineTag'),
        coverImageUrl: formData.get('coverImageUrl') || undefined,
        fileUrl: formData.get('fileUrl'),
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
        <h2 className="mb-4 font-semibold">{t('newBook')}</h2>
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
            {t('authorName')}
            <Input name="authorName" required />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('descriptionAr')}
            <Textarea name="descriptionAr" required dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('descriptionEn')}
            <Textarea name="descriptionEn" required dir="ltr" />
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
            {t('coverImageUrl')}
            <Input name="coverImageUrl" type="url" dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('fileUrl')}
            <Input name="fileUrl" type="url" required dir="ltr" />
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={creating} className="sm:col-span-2">
            {creating ? t('creating') : t('create')}
          </Button>
        </form>
      </Card>

      {!books ? null : books.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">{t('empty')}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {books.map((book) => (
            <Link key={book.id} href={`/admin/library/${book.id}`}>
              <Card className="flex items-center justify-between gap-3 transition hover:border-brand-500">
                <div>
                  <h3 className="font-medium">{book.titleEn}</h3>
                  <p className="text-xs text-slate-400">{book.authorName}</p>
                </div>
                <Badge variant={book.published ? 'success' : 'default'}>
                  {book.published ? t('published') : t('draft')}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
