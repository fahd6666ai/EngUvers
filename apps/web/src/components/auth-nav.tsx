'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@enguvers/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { getToken, clearToken } from '@/lib/auth-token';

export function AuthNav() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthed(!!getToken());
  }, []);

  if (isAuthed === null) return null;

  if (isAuthed) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button size="sm" variant="secondary">
            {t('dashboard')}
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearToken();
            setIsAuthed(false);
            router.push('/');
          }}
        >
          {t('logout')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button size="sm" variant="ghost">
          {t('login')}
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button size="sm">{t('register')}</Button>
      </Link>
    </div>
  );
}
