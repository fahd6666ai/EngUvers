/**
 * EngUvers Bridge — Velxio's `@pro` overlay entry point.
 *
 * This file (and everything it imports from this directory) is injected
 * at Docker build time via VITE_PRO_BUILD=true + PRO_OVERLAY_PATH — see
 * docs/LICENSING.md. Nothing here is copied into, or modifies, the
 * `services/simulator/velxio` submodule.
 *
 * Everything below is built on Velxio's own OSS extension seams
 * (`@velxio/lib/proSaveAction`, `@velxio/store/*`, `@velxio/utils/vlxFile`,
 * a global axios interceptor) — no core Velxio file is touched.
 *
 * postMessage contract with the EngUvers parent page
 * (apps/web/src/app/[locale]/lab/circuits/[projectId]/*):
 *
 *   Inbound  (parent -> this iframe):
 *     LOAD_PROJECT       { type, project: <.vlx-shaped JSON> }
 *     REQUEST_EXPORT     { type }
 *     SET_LOCALE         { type, locale: string }
 *     SET_READONLY       { type, readOnly: boolean }
 *     SET_ALLOWED_BOARDS { type, boards: string[] }  -- accepted, not yet enforced (see README)
 *
 *   Outbound (this iframe -> parent):
 *     READY              { type }
 *     PROJECT_DATA       { type, payload: VlxPayload }             -- reply to REQUEST_EXPORT
 *     PROJECT_CHANGED    { type, payload: VlxPayload }             -- debounced, drives autosave
 *     COMPILE_RESULT     { type, success: true }                   -- success-only, see README
 *     SIM_STATE          { type, running: boolean }
 *     SERIAL_OUTPUT      { type, output: string }
 *
 * The EngUvers-issued session token (read from `?enguvers_token=` on this
 * page's own URL) is attached as a Bearer header to every request Velxio's
 * frontend makes, via a global axios interceptor — see attachAuthToken()
 * below. Velxio's backend overlay (`bridge-overlay/backend/pro`) decodes
 * it to attribute compiles to an EngUvers user.
 */
import axios from 'axios';
import { installSaveActionImpl } from '@velxio/lib/proSaveAction';
import { buildVlxPayload, importVlxFile, type VlxPayload } from '@velxio/utils/vlxFile';
import { useEditorStore } from '@velxio/store/useEditorStore';
import { useSimulatorStore } from '@velxio/store/useSimulatorStore';
import { i18n } from '@velxio/i18n';

const ALLOWED_ORIGIN = import.meta.env.VITE_ENGUVERS_ORIGIN as string | undefined;
const PROJECT_CHANGED_DEBOUNCE_MS = 1500;

let readOnly = false;
let allowedBoards: string[] | null = null; // accepted, not yet enforced — see README
let suppressChangesUntil = 0;

function postToParent(message: Record<string, unknown>): void {
  if (!ALLOWED_ORIGIN || window.parent === window) return;
  window.parent.postMessage(message, ALLOWED_ORIGIN);
}

function attachAuthToken(): void {
  const token = new URLSearchParams(window.location.search).get('enguvers_token');
  if (!token) return;
  axios.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    return config;
  });
}

async function handleLoadProject(project: unknown): Promise<void> {
  // Set BEFORE importVlxFile runs: loadProjectState's internal `set()`
  // calls notify the store subscription synchronously, before this
  // function's own `await` yields — setting the guard after the call
  // would let that first, load-triggered change slip through.
  suppressChangesUntil = Date.now() + PROJECT_CHANGED_DEBOUNCE_MS + 250;
  try {
    const file = new File([JSON.stringify(project)], 'project.vlx', { type: 'application/json' });
    // Reuses Velxio's own validation + store hydration wholesale — no
    // duplicated parsing logic here.
    await importVlxFile(file);
  } catch (err) {
    console.warn('[enguvers-bridge] LOAD_PROJECT failed:', err);
  }
}

function handleRequestExport(): void {
  postToParent({ type: 'PROJECT_DATA', payload: buildVlxPayload() });
}

function handleSetLocale(locale: unknown): void {
  if (typeof locale === 'string') {
    void i18n.changeLanguage(locale).catch(() => {
      // Unsupported locale (e.g. 'ar' — Velxio ships no Arabic bundle):
      // i18next's fallbackLng keeps the UI in its default language. The
      // Circuit Lab's own Arabic chrome lives in the parent page.
    });
  }
}

function handleMessage(event: MessageEvent): void {
  if (!ALLOWED_ORIGIN || event.origin !== ALLOWED_ORIGIN) return;
  const data = event.data as { type?: string } | undefined;
  if (!data?.type) return;

  switch (data.type) {
    case 'LOAD_PROJECT':
      void handleLoadProject((data as { project?: unknown }).project);
      break;
    case 'REQUEST_EXPORT':
      handleRequestExport();
      break;
    case 'SET_LOCALE':
      handleSetLocale((data as { locale?: unknown }).locale);
      break;
    case 'SET_READONLY':
      readOnly = !!(data as { readOnly?: unknown }).readOnly;
      break;
    case 'SET_ALLOWED_BOARDS': {
      const boards = (data as { boards?: unknown }).boards;
      allowedBoards = Array.isArray(boards) ? boards.map(String) : null;
      break;
    }
    default:
      break;
  }
}

function installSaveOverride(): void {
  installSaveActionImpl(() => {
    if (readOnly) return;
    postToParent({ type: 'PROJECT_DATA', payload: buildVlxPayload() });
  });
}

function installChangeWatchers(): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleProjectChanged = () => {
    if (Date.now() < suppressChangesUntil) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      postToParent({ type: 'PROJECT_CHANGED', payload: buildVlxPayload() });
    }, PROJECT_CHANGED_DEBOUNCE_MS);
  };

  useEditorStore.subscribe(scheduleProjectChanged);
  // useSimulatorStore also drives SIM_STATE/SERIAL_OUTPUT/COMPILE_RESULT
  // below; re-using one subscription for both keeps this to a single
  // listener per store instead of two.
  let lastRunning: boolean | undefined;
  let lastSerialOutput: string | undefined;
  let lastCompiledHex: string | null | undefined;

  useSimulatorStore.subscribe((state) => {
    scheduleProjectChanged();

    if (state.running !== lastRunning) {
      lastRunning = state.running;
      postToParent({ type: 'SIM_STATE', running: state.running });
    }
    if (state.serialOutput !== lastSerialOutput) {
      lastSerialOutput = state.serialOutput;
      postToParent({ type: 'SERIAL_OUTPUT', output: state.serialOutput });
    }
    // Success-only: a failed compile never sets compiledHex, so it can't
    // be distinguished here from "haven't compiled yet". Relaying actual
    // compile failures would need a hook Velxio doesn't currently expose
    // to an external overlay without touching EditorToolbar.tsx — see
    // README's "Known limitations".
    if (state.compiledHex !== lastCompiledHex) {
      lastCompiledHex = state.compiledHex;
      if (state.compiledHex) {
        postToParent({ type: 'COMPILE_RESULT', success: true });
      }
    }
  });
}

export const mountPro = (): void => {
  if (!ALLOWED_ORIGIN) {
    console.warn('[enguvers-bridge] VITE_ENGUVERS_ORIGIN not set — bridge disabled.');
    return;
  }
  attachAuthToken();
  installSaveOverride();
  installChangeWatchers();
  window.addEventListener('message', handleMessage);
  postToParent({ type: 'READY' });
};

// Re-exported so a future consumer of this module can build/validate a
// payload without re-importing straight from the submodule path.
export type { VlxPayload };
