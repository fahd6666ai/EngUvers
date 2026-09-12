'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { apiClient } from '@/lib/api-client';
import { getToken } from '@/lib/auth-token';

export default function NewCircuitProjectPage() {
  const router = useRouter();
  const createdRef = useRef(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    // StrictMode/dev double-invoke guard — only ever create one project per
    // visit to this page.
    if (createdRef.current) return;
    createdRef.current = true;

    apiClient
      .post<{ id: string }>('/circuit-projects', {})
      .then((project) => router.replace(`/lab/circuits/${project.id}`));
  }, [router]);

  return null;
}
