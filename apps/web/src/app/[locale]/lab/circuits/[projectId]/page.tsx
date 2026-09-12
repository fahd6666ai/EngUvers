'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Card } from '@enguvers/ui';
import { useRouter } from '@/i18n/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { clearToken, getToken } from '@/lib/auth-token';
import { isSimulatorMessage, sendToSimulator } from '@/lib/simulator-bridge';

const SIMULATOR_URL = process.env.NEXT_PUBLIC_SIMULATOR_URL ?? 'http://localhost:5080';
const SIMULATOR_ORIGIN = new URL(SIMULATOR_URL).origin;
// Pinned commit this deployment runs — see docs/LICENSING.md. Update this
// alongside services/simulator/velxio's submodule pin.
const VELXIO_SOURCE_COMMIT = 'c4bbb08569e7f4089abfc631714f9dea40bb328e';
const VELXIO_SOURCE_URL = `https://github.com/davidmonterocrespo24/velxio/tree/${VELXIO_SOURCE_COMMIT}`;

interface CircuitProject {
  id: string;
  name: string;
  vlxContent: unknown;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function CircuitLabPage() {
  const t = useTranslations('lab');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [project, setProject] = useState<CircuitProject | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [running, setRunning] = useState(false);
  const [serialOutput, setSerialOutput] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
      return;
    }
    Promise.all([
      apiClient.get<CircuitProject>(`/circuit-projects/${projectId}`),
      apiClient.post<{ token: string }>(`/circuit-projects/${projectId}/session-token`),
    ]).then(
      ([proj, session]) => {
        setProject(proj);
        setSessionToken(session.token);
      },
      (err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/auth/login');
        } else {
          setNotFound(true);
        }
      },
    );
  }, [projectId, router]);

  const saveProject = useCallback(
    (vlxContent: unknown) => {
      setSaveStatus('saving');
      apiClient
        .patch(`/circuit-projects/${projectId}`, { vlxContent })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('idle'));
    },
    [projectId],
  );

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isSimulatorMessage(event, SIMULATOR_ORIGIN)) return;
      const message = event.data;
      switch (message.type) {
        case 'READY':
          if (project) {
            sendToSimulator(iframeRef.current, SIMULATOR_ORIGIN, {
              type: 'LOAD_PROJECT',
              project: project.vlxContent,
            });
            sendToSimulator(iframeRef.current, SIMULATOR_ORIGIN, {
              type: 'SET_LOCALE',
              locale,
            });
          }
          break;
        case 'PROJECT_CHANGED':
          saveProject(message.payload);
          break;
        case 'SIM_STATE':
          setRunning(message.running);
          break;
        case 'SERIAL_OUTPUT':
          setSerialOutput(message.output);
          break;
        default:
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project, locale, saveProject]);

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="text-center">{t('notFound')}</Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row" dir="ltr">
      {/* The simulator's own UI has no Arabic locale (see docs/LICENSING.md /
          CLAUDE.md) — its pane stays LTR regardless of the page locale. */}
      <div className="hidden flex-1 lg:block">
        {sessionToken && (
          <iframe
            ref={iframeRef}
            title="Velxio Circuit Simulator"
            src={`${SIMULATOR_URL}/editor?enguvers_token=${encodeURIComponent(sessionToken)}`}
            className="h-screen w-full border-0"
            allow="clipboard-write"
          />
        )}
      </div>
      <div className="block flex-1 border-b border-slate-200 p-6 text-center lg:hidden dark:border-slate-800">
        {t('mobileNotice')}
      </div>

      <aside
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className="flex w-full flex-col gap-4 border-t border-slate-200 p-6 lg:w-96 lg:border-t-0 lg:border-s dark:border-slate-800"
      >
        <h1 className="text-lg font-semibold">{project?.name ?? '...'}</h1>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t('status')}</span>
          <Badge variant={saveStatus === 'saving' ? 'default' : 'success'}>
            {saveStatus === 'saving' ? t('saving') : t('saved')}
          </Badge>
          <Badge variant={running ? 'success' : 'default'}>
            {running ? t('running') : t('stopped')}
          </Badge>
        </div>

        <Button variant="secondary" disabled title="Coming in a later phase (Engineering AI)">
          {t('explainError')}
        </Button>
        <Button variant="secondary" disabled title="Coming in a later phase (Portfolio)">
          {t('publishToPortfolio')}
        </Button>

        <div>
          <h2 className="mb-1 text-sm font-medium text-slate-500">{t('serialMonitor')}</h2>
          <pre
            dir="ltr"
            className="h-40 overflow-auto rounded-md bg-slate-950 p-2 text-xs text-green-400"
          >
            {serialOutput || '—'}
          </pre>
        </div>

        <p className="mt-auto text-xs text-slate-400">
          {t('poweredBy')}{' '}
          <a href={VELXIO_SOURCE_URL} target="_blank" rel="noreferrer" className="underline">
            Velxio ({VELXIO_SOURCE_COMMIT.slice(0, 7)})
          </a>{' '}
          — AGPLv3
        </p>
      </aside>
    </main>
  );
}
