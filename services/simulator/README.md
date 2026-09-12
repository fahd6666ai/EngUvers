# services/simulator — EngUvers Circuit Lab (Velxio integration)

Phase 2. Runs [Velxio](https://github.com/davidmonterocrespo24/velxio)
(AGPLv3) as a fully separate service, embedded into `apps/web`'s
`/[locale]/lab/circuits/[projectId]` page via `<iframe>` + `postMessage`.
See `../../docs/LICENSING.md` for the full licensing rationale — summary:
**no fork, zero modifications to Velxio**, using its own official
build-time extension mechanism.

## Layout

```
services/simulator/
├── velxio/              git submodule -> davidmonterocrespo24/velxio,
│                         pinned to c4bbb08569e7f4089abfc631714f9dea40bb328e.
│                         NEVER commit into this directory — see
│                         ../../docs/LICENSING.md rule #1.
├── bridge-overlay/
│   ├── frontend/         our `@pro` overlay (mountPro + postMessage bridge)
│   │   ├── index.ts       the actual bridge — start here
│   │   ├── data/proExamples.ts, desktop_index.ts, pages/marketing.ts,
│   │   │   i18n/register.ts   trivial no-op mirrors of Velxio's own OSS
│   │   │                      stub — required because PRO_OVERLAY_PATH
│   │   │                      replaces the *entire* `@pro` alias target,
│   │   │                      not just the files we care about
│   └── backend/
│       ├── pro/__init__.py    `register_pro(app)` — auto-loaded by
│       │                      Velxio's own `main.py`
│       └── requirements-overlay.txt   extra Python deps (PyJWT) the
│                                       overlay needs
├── Dockerfile            builds the submodule + injects the overlay
└── entrypoint.sh         arduino-cli setup + uvicorn + nginx
```

## How the Bridge gets into an unmodified checkout

- **Frontend**: `frontend/vite.config.ts` aliases `@pro` to
  `PRO_OVERLAY_PATH` when `VITE_PRO_BUILD=true`. Our Dockerfile COPYs
  `bridge-overlay/frontend/` into `velxio/frontend/src/pro/` at build
  time (Node's `node_modules` resolution needs the overlay files to
  physically sit inside the `frontend/` tree — an external
  `PRO_OVERLAY_PATH` elsewhere on disk fails to resolve bare imports
  like `axios`; this is not optional, it's how Velxio's own author
  documents deploying `velxio-prod`).
- **Backend**: `backend/app/main.py` already does, unconditionally:
  `try: from app.pro import register_pro; register_pro(app) except
  ImportError: pass`. Our Dockerfile COPYs `bridge-overlay/backend/pro/`
  to `velxio/backend/app/pro/`.

Neither COPY modifies a single existing file in the submodule.

## postMessage contract

See the header comment in `bridge-overlay/frontend/index.ts` (canonical)
and `apps/web/src/lib/simulator-bridge.ts` (the parent side — keep both
in sync). Origin-checked both directions
(`VITE_ENGUVERS_ORIGIN` build arg / `WEB_ORIGIN` env var).

## Auth: the EngUvers session token

`apps/web`'s Lab page calls `POST /circuit-projects/:id/session-token`
(apps/api) and appends the result to the iframe's `src` as
`?enguvers_token=`. The overlay reads it once at mount and attaches it as
a `Bearer` header to every request Velxio's frontend makes (a global
axios interceptor — no core file touched). The backend overlay decodes
it (same `JWT_SECRET` as apps/api) to attribute compile attempts to an
EngUvers user in `record_compile`.

## What's implemented vs. deferred (Phase 2 scope)

**Implemented:**
- `LOAD_PROJECT` / `REQUEST_EXPORT` — full round-trip via Velxio's own
  `importVlxFile`/`buildVlxPayload` (zero duplicated parsing logic).
- `PROJECT_CHANGED` (debounced autosave), `SIM_STATE`, `SERIAL_OUTPUT`.
- `COMPILE_RESULT` — **success only**. A failed compile has no store
  action to hook (compile errors live in `EditorToolbar.tsx`'s local
  component state, not a Zustand store) — relaying it without touching
  that core file would need a Velxio-side hook that doesn't exist yet.
  Revisit when Phase 4's "explain my error" feature needs it; the honest
  fallback today is that a compile failure is visible in the simulator's
  own UI (which is what a user embedded full-screen would see anyway),
  just not mirrored into the Arabic side panel.
- `SET_LOCALE` — best-effort (`i18n.changeLanguage`); Velxio ships no
  Arabic bundle, so this only matters for its other 9 locales.
- Per-user compile attribution (`record_compile`), logged only — no
  quota/entitlement enforcement yet (no `circuit_lab.*` `PlanLimit` row
  exists; seeded when a paid-tier feature actually needs one, same rule
  Phase 1 applied elsewhere).

**Accepted but not enforced:**
- `SET_READONLY` — gates our own save-action override only; the
  simulator's own editor/toolbar stays interactive (no core UI lock).
- `SET_ALLOWED_BOARDS` — stored, not yet used to restrict the board
  picker.

**Not built this phase:** ESP32/Pi/QEMU boards (the Dockerfile only
installs the arduino-cli lane — AVR + RP2040), rate limiting / reverse
proxy in front of compiles, the "explain my error" AI wiring (Phase 4),
publish-to-portfolio (Phase 5).

## Local development / what was actually verified

Docker Hub pulls were blocked by this sandbox's network policy
(`docker pull node:20-slim` → 403 from `production.cloudfront.docker.com`)
— the same constraint noted in the Phase 0 plan. Every piece was instead
validated natively, running all four services (Velxio backend, Velxio
frontend dev server with the overlay wired in, `apps/api`, `apps/web`)
side by side and driving the real UI with Playwright:

```bash
# Frontend, with the overlay wired in exactly as the Dockerfile does:
cd services/simulator/velxio/frontend
npm install --legacy-peer-deps   # works around an npm 10 arborist bug, unrelated to us
cp -r ../../bridge-overlay/frontend/* src/pro/
VITE_PRO_BUILD=true PRO_OVERLAY_PATH=./src/pro VITE_ENGUVERS_ORIGIN=http://localhost:3000 \
  npx vite dev --port 5173   # dev server, not build: its own vite.config.ts already
                              # proxies /api -> 127.0.0.1:8001, which only resolves
                              # correctly when both run on the same host (true here,
                              # NOT true across separate Docker containers — the
                              # shipped Dockerfile instead runs both in one container
                              # behind nginx, see nginx.conf's /api/ proxy_pass)
rm -rf src/pro dist   # never leave overlay files inside the submodule checkout

# Backend (isolated venv — the sandbox's system Python had a broken
# cryptography/cffi install unrelated to this project):
cd services/simulator/velxio/backend
python3 -m venv /tmp/velxio-venv && source /tmp/velxio-venv/bin/activate
pip install -r requirements.txt -r ../../bridge-overlay/requirements-overlay.txt
cp -r ../../bridge-overlay/backend/pro app/pro
JWT_SECRET=<same value as apps/api> uvicorn app.main:app --port 8001
```

**Result: load → edit → autosave → reopen confirmed working end-to-end**
(registered a user, created a project, confirmed the Blink starter loads
into Monaco via `LOAD_PROJECT`, edited the sketch, confirmed via a direct
API call that the edit persisted through the debounced `PROJECT_CHANGED`
autosave, closed and reopened the project and confirmed the *edited*
content reloads — not the original starter).

Two real bugs were caught and fixed by this testing, not left for later:
1. `starter-project.ts` set the board id to `uno-1` with
   `activeFileGroupId: 'group-arduino-uno'` — but Velxio's own `addBoard()`
   derives a board's file-group id as `group-${boardId}`, so a board id of
   `uno-1` gets group `group-uno-1`, orphaning the starter file content.
   Fixed by using `'arduino-uno'` as the board id (matching what `addBoard`
   itself would assign to the first board of that kind).
2. The bridge's autosave-suppression-right-after-load guard was set
   *after* `await importVlxFile(...)`, but the store notifications
   `importVlxFile` triggers fire synchronously before that `await`
   resolves — so the guard came too late to catch them. Fixed by setting
   it before the call.

**Not verified in this sandbox:** actually compiling and running the
Blink example (avr8js simulation, LED toggling). `arduino-cli`'s install
script depends on `github.com/arduino/arduino-cli/releases/latest`, which
this session's egress policy blocks for HTTP requests outside its allowed
repo set (git clone access ≠ arbitrary HTTPS access to the same host); an
alternate arduino.cc download host was also blocked. This is an
environment constraint, not a code issue — the compile path itself
(`services/compilation.ts` → `/api/compile/start` → arduino-cli
subprocess) is unmodified Velxio code, and the bridge's `SIM_STATE`/
`SERIAL_OUTPUT`/`COMPILE_RESULT`(success) relays are wired to the same
store fields regardless of what produced the compiled hex.

`docker compose up --build` (once Docker Hub is reachable) brings up the
full image on `http://localhost:5080`.
