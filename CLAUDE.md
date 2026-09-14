# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repository.

## Project Overview

**EngUvers (عالم المهندسين)** — "Your Engineering Universe". A platform for
Arab engineering students/engineers spanning learning (books, courses,
exams), hands-on practice (a browser-based circuit/embedded-systems
simulator built on Velxio), an AI tutor, skills/portfolio tracking, career
tools (including an AI mock interview), and monetization (subscriptions,
local vouchers, cards).

The full product brief and phase plan live in the approved plan; this file
tracks the *as-built* structure, commands, and decisions, updated at the
end of every phase.

## Monorepo Structure

```
enguvers/
├── apps/
│   ├── web/          Next.js (App Router) + TypeScript + Tailwind + next-intl
│   ├── api/           NestJS + Prisma + PostgreSQL + Redis (BullMQ from Phase 2+)
│   └── mobile/        placeholder — Phase 8
├── services/
│   ├── ai/            FastAPI, Claude API via LLMProvider (Phase 4) — see its own README.md
│   └── simulator/      Circuit Lab (Velxio, Phase 2) — see its own README.md
├── packages/
│   ├── config/        shared eslint / tsconfig / tailwind preset
│   ├── types/         shared domain types (Role, PlanCode, Entitlement*, ...)
│   └── ui/             shared RTL-aware UI primitives (cn, Button, ...)
├── docs/
│   ├── ERD.md          entity-relationship diagram (Mermaid), updated per phase
│   ├── PAGES.md        route map, updated per phase
│   └── LICENSING.md    Velxio/AGPL separation rules (real content from Phase 2)
└── docker-compose.yml  one command, whole dev stack
```

## Commands

```bash
# Install everything (pnpm workspace)
pnpm install

# Run apps/web + apps/api in watch mode (needs Postgres/Redis reachable —
# either via `docker compose up postgres redis` or your own instances)
pnpm dev

# Whole stack in Docker (web, api, postgres, redis, minio, meilisearch, simulator)
docker compose up --build
# web       -> http://localhost:3000
# api       -> http://localhost:4000  (health: GET /health)
# simulator -> http://localhost:5080  (health: GET /health) — Circuit Lab

# First-time submodule checkout (Velxio, pinned — see docs/LICENSING.md)
git submodule update --init --recursive

# Quality gates (turbo runs these per-package; a package without the
# script is skipped, not failed)
pnpm lint
pnpm typecheck
pnpm test

# Prisma (apps/api)
pnpm db:generate     # prisma generate
pnpm db:migrate       # prisma migrate dev (creates a new migration)
pnpm db:seed          # prisma db seed (reference data only — see prisma/seed.ts)
```

## Architecture Decisions

- **Monorepo**: pnpm workspaces + Turborepo. NestJS (not Next.js API
  routes) for `apps/api` from day one, because BullMQ workers (compile
  queue orchestration in Phase 2, AI notebook processing in Phase 4, exam
  grading in Phase 3) need a process model independent of the web app's
  deploy cadence — folding it into Next.js later would mean a rewrite at
  exactly the point the platform gets complex.
- **i18n**: `next-intl`, locale-prefixed routes (`/[locale]/...`), `ar`
  default + RTL (`dir="rtl"` set on `<html>` per locale), `en` secondary +
  LTR. Shared components use Tailwind logical-property utilities
  (`ms-*`/`me-*`/`ps-*`/`pe-*`, `text-start`/`text-end`) instead of
  `ml-*`/`mr-*` so the same class works in both directions — see
  `packages/config/tailwind-preset.js`.
- **Entitlements**: every feature check goes through the central
  `Entitlement` model (`apps/api/prisma/schema.prisma`) via a
  `entitlements.can(userId, feature)`-style check — never a scattered
  `if (user.plan === 'pro')`. `packages/types` defines the
  `EntitlementFeature` union and `PlanLimit` shape shared by both apps.
- **Circuit Lab (Velxio)**: runs as a fully separate service
  (`services/simulator`), never vendored into `apps/web`/`apps/api`. The
  Phase 0 plan assumed we'd need our own fork; Phase 2 found something
  better while implementing it — Velxio ships an official, zero-
  modification extension mechanism (a build-time `@pro` alias for the
  frontend, an auto-loaded `backend/app/pro/` package for the backend;
  the same mechanism its own author uses to build the closed-source
  `velxio-prod`). So: **no fork** — `services/simulator/velxio` is a git
  submodule pointing straight at upstream, pinned to one commit SHA, byte-
  for-byte unmodified. The entire Bridge lives in
  `services/simulator/bridge-overlay/` (this repo) and is injected only
  at Docker build time. See `docs/LICENSING.md` (full rationale) and
  `services/simulator/README.md` (what's implemented vs. deferred).
- **No secrets in code**: everything sensitive is an env var; see
  `.env.example` (root, for docker-compose) and `apps/api/.env.example`
  (for running `apps/api` outside Docker).
- **No fake data presented as real**: `apps/api/prisma/seed.ts` seeds only
  reference/configuration data (countries, plans, a small real starter set
  of universities/faculties, and the brief's generic discipline/major
  list) — no placeholder users or content.
- **Auth**: a global `JwtAuthGuard` (`APP_GUARD` in `AppModule`) protects
  every API route by default; a route opts OUT with `@Public()`, never the
  other way around — a new route that forgets to annotate itself stays
  protected. `@Roles(...)` + `RolesGuard` gate by role;
  `@RequireEntitlement(feature)` + `EntitlementsGuard` gate by plan (no
  route uses it yet — see Entitlements above). Two credential paths ship
  in Phase 1: email+password (bcryptjs + JWT) and phone OTP. Google OAuth
  is deferred (needs real client credentials) — the button is present in
  the UI but disabled.
- **Swappable provider pattern**: `OtpProvider`
  (`apps/api/src/auth/otp/otp-provider.interface.ts`) follows the same
  shape the plan calls for with `LLMProvider`/`PaymentProvider` — a DI
  token + interface, with a dev-mode default (`ConsoleOtpProvider`, logs
  the code) swapped for a real SMS gateway adapter later without touching
  `AuthService`. `IseAnalysisProvider`
  (`apps/api/src/circuit-lab/ise-analysis/`) is the first real
  `LLMProvider`-shaped seam: same DI token + interface shape, with
  `UnavailableIseAnalysisProvider` as the placeholder default (throws a
  clear 503 instead of fabricating an explanation) until `services/ai` and
  an `ANTHROPIC_API_KEY` exist in Phase 4 — swap the provider then, nothing
  above the seam (`CircuitLabService.explainProject`, the `ise.analysis`
  entitlement gate, the web "Explain my project" button) changes.
- **Web ↔ API auth boundary**: the JWT lives in `localStorage` + a plain
  (non-httpOnly) cookie (`apps/web/src/lib/auth-token.ts`); `middleware.ts`
  checks the cookie's presence only, to redirect an unauthenticated
  visitor away from `/dashboard` before a UI flash. That check is NOT the
  security boundary — every request is still authorized server-side by
  the API's `JwtAuthGuard` regardless of what the client sends.
- **Onboarding-before-account bridge**: the brief's onboarding order
  (language → country → academic, all before auth) collides with
  `POST /me/onboarding` requiring a logged-in user. Resolved with a
  client-side draft (`apps/web/src/lib/onboarding-draft.ts`,
  `sessionStorage`) that the auth pages flush to the API right after a
  successful register/login/OTP-verify (`apply-onboarding-draft.ts`).

## Phase Log

- **Phase 0** — Monorepo scaffolding: `apps/web` (Next.js + next-intl RTL
  placeholder landing page), `apps/api` (NestJS + Prisma schema covering
  users/roles/academic-structure/entitlements/vouchers/skills, seeded with
  countries + plans), shared `packages/*`, `docker-compose.yml`, CI
  (lint/typecheck/prisma validate/test), `docs/ERD.md` + `docs/PAGES.md`,
  and this file. `services/ai`, `services/simulator`, `apps/mobile` are
  placeholders only — implemented in Phases 4, 2, and 8 respectively.

- **Phase 1 (current)** — Design system additions (`Input`, `Select`,
  `Card`, `Badge` in `packages/ui`); a real landing page (journey steps,
  discipline list, CTAs); the onboarding flow
  (language/country/academic); auth (email+password and phone OTP, JWT,
  global guard); the Entitlements system made real
  (`EntitlementsService`/`EntitlementsGuard`, auto-granted `free` plan on
  signup, `GET /me/entitlements`); a dashboard aggregating profile/skills/
  entitlements/journey progress; and route protection via `middleware.ts`.
  First real Prisma migration (`prisma/migrations/`) generated and
  applied — Phase 0 never had a live Postgres to generate one against.
  Verified end-to-end with a running API + web dev server (curl for the
  API, a scripted Playwright run for the full onboarding → register →
  dashboard → logout UI flow) — see the Phase 1 completion message for
  the manual steps.

  Deferred inputs (not blockers for Phase 1, needed later):
  - Anthropic API key + usage budget/per-tier caps — before Phase 4 ships.
  - Jeeb (or other regional e-wallet) API credentials/docs — before
    Phase 6's voucher-provider adapter ships; the voucher engine itself is
    provider-agnostic and doesn't wait on this.
  - Google OAuth client ID/secret — before the "Continue with Google"
    button (currently disabled) can be wired up.
  - A real SMS gateway — phone OTP currently only logs the code
    server-side and echoes it in the API response outside production
    (`AuthService.requestOtp`); swap `ConsoleOtpProvider` once one is
    chosen.
  - A fuller university/faculty/major/curriculum dataset — Phase 1 seeds
    a small real starter set (2 universities per seeded country, one
    engineering faculty each) plus the generic discipline-level majors;
    growing this catalog is ongoing content work, not a Phase 2 blocker.

- **Phase 2** — Circuit Lab. `services/simulator/velxio` added
  as a git submodule pinned to `c4bbb08569e7f4089abfc631714f9dea40bb328e`
  (unmodified — see the Circuit Lab architecture decision above and
  `docs/LICENSING.md`). `services/simulator/bridge-overlay/` implements
  the postMessage bridge (frontend: `mountPro()`, save-action override,
  store-subscription-driven `PROJECT_CHANGED`/`SIM_STATE`/`SERIAL_OUTPUT`/
  `COMPILE_RESULT`; backend: `register_pro()` wiring
  `get_current_user_id`/`record_compile`) and `services/simulator/
  Dockerfile` builds it (arduino-cli lane only — AVR + RP2040, no ESP32/
  Pi/QEMU this phase). API: `CircuitProject` model, `circuit-lab` module
  (create/get/patch-autosave, short-lived per-project session tokens).
  Web: `/lab` (Project Lab shell/list), `/lab/circuits/new`,
  `/lab/circuits/[projectId]` (iframe + Arabic side panel, AGPL source
  link). **Verified end-to-end natively** (all four services — Velxio
  backend/frontend, apps/api, apps/web — run side by side, driven with
  Playwright): register → create project → Blink starter loads into
  Monaco via `LOAD_PROJECT` → edit → debounced `PROJECT_CHANGED` autosave
  confirmed via a direct API check → close and reopen loads the *edited*
  content, not the original starter. Two real bugs this caught and fixed:
  a board-id/file-group-id mismatch in the starter project (Velxio derives
  a board's group id as `group-${boardId}`; the starter used a mismatched
  id and orphaned its own file content) and a suppression-timing race in
  the bridge (a guard meant to swallow the load's own echo was set after
  the store notifications it needed to catch had already fired). Not
  verified: an actual compile/run of Blink (avr8js simulation) —
  `arduino-cli`'s installer needs `github.com/arduino/arduino-cli/releases`
  and an arduino.cc download host, both outside this session's egress
  allowlist; full `docker compose` build is separately blocked by the same
  Docker Hub restriction as Phase 0. See `services/simulator/README.md`
  for the complete verification log.

  Deferred inputs / known gaps (see services/simulator/README.md for
  full detail):
  - `COMPILE_RESULT` relays success only — a compile failure isn't
    mirrored to the parent page yet (would need touching Velxio core UI
    code, which the "zero modification" rule above forbids without a
    deliberate escalation).
  - `SET_READONLY`/`SET_ALLOWED_BOARDS` are accepted but not enforced in
    the simulator's own UI.
  - No ESP32/Pi boards, no compile-quota enforcement (no `circuit_lab.*`
    `PlanLimit` row exists yet — seeded when a paid tier actually needs
    one).
  - `POST /circuit-projects/:id/explain` ("Explain my project", the
    `ise.analysis`-gated Engineering AI feature) is wired end-to-end —
    entitlement guard, service method, web button — but delegates to
    `UnavailableIseAnalysisProvider`, which always throws 503: no
    `ise.analysis` `PlanLimit` row exists yet, and there's no real provider
    until Phase 4 brings `services/ai` + an `ANTHROPIC_API_KEY`. See the
    Swappable provider pattern decision above.
  - Docker Hub base-image pulls (`node:20-slim`, `python:3.12-slim`) are
    blocked in this sandbox; the Dockerfile's individual steps were all
    validated natively instead. Should build fine wherever Docker Hub is
    reachable.

- **Phase 3 (current)**

  **Slice 1 — Engineering Academy (EA)** — courses. New models: `Course` (authored by `admin`/`instructor`,
  `published` boolean gate), `Lesson` (`video` or `article`, ordered
  within its course), `CourseEnrollment` (`completedAt` stamped once
  every lesson has a matching completion), `LessonCompletion`. API:
  `academy` module — public catalog (`GET /academy/courses`,
  `GET /academy/courses/:id`), entitlement-gated enroll/complete
  (`academy.courses`, granted to `free` in `prisma/seed.ts` — this
  feature, unlike `ise.analysis`, has no missing external dependency, so
  it's turned on for real rather than left as a placeholder), and a
  role-gated (`admin`/`instructor`, via `RolesGuard` + `@Roles()` —
  their first real use) content-admin sub-controller at `/admin/academy`
  for course/lesson CRUD. `GET /me/dashboard`'s `completedFirstCourse`
  is wired to real `CourseEnrollment` data instead of the Phase 1
  placeholder `false`. Web: `/academy` (catalog), `/academy/[courseId]`
  (lesson browsing + enroll + mark-complete, public read/gated write —
  same split as the academic catalog), `/admin/academy` and
  `/admin/academy/[courseId]` (the first content-admin panel: create
  courses, publish/unpublish, add/delete lessons). Added a `Textarea`
  primitive to `packages/ui` (course summaries, article lesson bodies)
  — the first packages/ui addition since Phase 1's Input/Select/Card/
  Badge.

  Verified via lint + typecheck (clean across all 5 workspace packages)
  and 15 new unit tests in `academy.service.spec.ts` (Prisma mocked),
  42 total passing in `apps/api` — `dashboard.service.ts`'s
  `completedFirstCourse` wiring has no dedicated test of its own; there
  was no `dashboard.service.spec.ts` before this phase either. Migration
  (`prisma/migrations/20260914213000_academy_courses/`) was generated
  with `prisma migrate diff --from-schema-datamodel
  --to-schema-datamodel --script` (schema-to-schema, no database
  required) and reviewed by hand. **Verified live** in a follow-up
  session against a real Postgres — see the consolidated live-
  verification note after Slice 3 for what was actually exercised and
  how (no Docker involved).

  **Slice 2 — Engineering Books (EB)** — a book catalog. New model:
  `Book` (added/edited by `admin`/`instructor`, `published` boolean
  gate) — a flat catalog, no lessons/enrollment the way `Course` has.
  API: `library` module — public catalog (`GET /library/books`,
  `GET /library/books/:id`, metadata only — `fileUrl` is never
  returned here), an entitlement-gated (`library.books`, granted to
  `free`, same reasoning as `academy.courses`)
  `GET /library/books/:id/access` that's the only place `fileUrl` is
  ever returned (mirrors `CircuitLabService.issueSessionToken`'s
  "gate the resource behind its own endpoint" shape), and a role-gated
  content-admin sub-controller at `/admin/library` for book CRUD. Web:
  `/library` (catalog), `/library/[bookId]` (metadata + a gated "Open
  book" button that fetches the link and opens it in a new tab),
  `/admin/library` and `/admin/library/[bookId]` (content-admin: add
  books, publish/unpublish, delete).

  Verified the same way as Slice 1: lint + typecheck clean, 9 new unit
  tests in `library.service.spec.ts` (Prisma mocked), 51 total passing
  in `apps/api`. Migration (`prisma/migrations/20260914220000_library_books/`)
  generated the same schema-diff way. **Verified live** alongside
  Slice 1 in the same follow-up session — see the consolidated note
  after Slice 3.

  **Slice 3 — Engineering Exams (EE)** — multiple-choice, auto-graded
  exams (the brief's "auto-graded tests and challenges", not free-text/
  AI-graded — that's a different feature). New models: `Exam` (authored
  by `admin`/`instructor`, `published` gate), `Question` (ordered,
  `points`, default 1), `AnswerOption` (exactly one `isCorrect` per
  question — enforced in `ExamsService.createQuestion`, not the DTO
  layer), `ExamAttempt` (`totalPoints` snapshotted from the exam's
  questions at start time, so a later question-bank edit never
  retroactively changes a past attempt's grading), `AttemptAnswer`
  (`isCorrect` computed once at submit time, looked up within *that
  question's own* options only — an option id from a different question
  can't be credited; covered by a dedicated unit test). API: `exams`
  module — public catalog (`GET /exams`, `GET /exams/:id`),
  entitlement-gated (`exams.full_bank`, granted to `free`, same
  reasoning as the other two features) `POST /exams/:id/start` (returns
  questions/options with `isCorrect` stripped) and
  `POST /exams/attempts/:id/submit` (one submit per attempt — a second
  call is rejected), `GET /exams/me/attempts` and
  `GET /exams/attempts/:id` (owner-only review), and a role-gated
  content-admin sub-controller at `/admin/exams` (exam CRUD; questions
  are created with their options nested in one call — no per-option
  endpoint, edit a question's options by deleting and recreating it,
  same "MVP authoring, not a full editorial workflow" call the academy/
  library admin panels made). `GET /me/dashboard`'s `passedFirstExam` is
  wired to real `ExamAttempt` data — "passed" means ≥60% of the
  attempt's `totalPoints` on any submitted attempt, an LMS-default
  threshold the brief doesn't pin down. Web: `/exams` (catalog + "your
  attempts"), `/exams/[examId]` (metadata → start → answer → submit,
  all on one page — no "resume an in-progress attempt" endpoint exists
  yet, so this doesn't try to survive a refresh mid-attempt),
  `/exams/attempts/[attemptId]` (review: each question, the answer
  given, correct or not), `/admin/exams` and `/admin/exams/[examId]`
  (content-admin: create exams, publish/unpublish, add a question via
  four fixed option slots with a "mark correct" radio, delete a
  question).

  Verified the same way as Slices 1-2: lint + typecheck clean, 12 new
  unit tests in `exams.service.spec.ts` (Prisma mocked) — including the
  cross-question-option-not-credited and already-submitted cases named
  above — 63 total passing in `apps/api`. Migration
  (`prisma/migrations/20260914223000_exams/`) generated the same
  schema-diff way. **Verified live** alongside Slices 1-2 — see below.

  **Live verification (follow-up session, all three slices together)**
  — no Docker daemon was reachable in *this* session either, but a
  local PostgreSQL 16 binary install turned out to already exist at
  `/usr/lib/postgresql/16/bin` (just not on `PATH` or running); `initdb`
  + `pg_ctl` under a non-root user brought up a real Postgres with no
  Docker involved. Against it: `prisma migrate deploy` applied all five
  migrations cleanly (the three hand-written schema-diff ones included)
  in one pass; `prisma db seed` ran clean, including the new
  `academy.courses`/`library.books`/`exams.full_bank` `PlanLimit` rows.
  With the API running against that database, curl exercised every
  slice end-to-end as two real users (one promoted to `admin` via a
  direct SQL update, then re-logged-in for a fresh JWT — role is baked
  into the token at issue time, not re-read per request): created,
  published, and browsed a course/book/exam through the real
  content-admin routes; enrolled, completed a lesson, and watched
  `completedFirstCourse` flip to `true` on `GET /me/dashboard`; fetched
  a book's `fileUrl` only through the gated `/access` route (confirmed
  absent from the public catalog/detail responses); started an exam
  attempt (confirmed `isCorrect` is never present in that payload),
  submitted a mixed-correctness answer set and got back the exact
  expected score, then confirmed a second submit on the same attempt is
  rejected (400) and that **an option id from one question submitted
  against a different question is not credited** — the specific
  adversarial case the unit tests assert in isolation, now confirmed
  against real grading code end-to-end. Also confirmed: an unpublished
  exam 404s from both the public detail route and `/start` for an
  entitled student while remaining visible via `/admin/exams/:id`; a
  non-owner (including an admin) gets 404 reading someone else's
  attempt via `GET /exams/attempts/:id`; a student gets 403 from every
  `/admin/*` route; `POST /circuit-projects/:id/explain` still honestly
  403s (`ise.analysis` has no `PlanLimit` row, by design — Phase 4).
  Every result matched what the unit tests and the code predicted — no
  bugs found. The database and API process were torn down after; this
  was local, throwaway verification, not a deployment.

  Not yet built: any ownership restriction on the three content-admin
  panels (currently any `admin`/`instructor` can edit any course, book,
  or exam, not just their own); a resume-in-progress-attempt endpoint;
  per-question explanations shown on review. Phase 3 as scoped (EB + EA
  + EE with a content-admin panel) is feature-complete and now verified
  live, not just unit-tested — Engineering AI (EAI), Student Notebook,
  Engineering Portfolio (EP), Engineering Career (EC), and the rest are
  later phases per `docs/PAGES.md`.

- **Phase 4 (current) — `services/ai` scaffolding only.** A standalone
  FastAPI service, not a `apps/api` module — it trusts the same JWTs
  `apps/api` issues (HS256, shared `JWT_SECRET`, `sub` claim) rather than
  running a second auth system, and sits behind `apps/api`'s
  `EntitlementsGuard` as a resource server, not a second entitlement
  system. Built: `LLMProvider` (`app/llm/provider.py`) — the same
  swappable-provider shape as `OtpProvider`/`IseAnalysisProvider`:
  `ClaudeProvider` (real, Anthropic SDK — refuses to guess a model, so
  `ANTHROPIC_MODEL` is required alongside `ANTHROPIC_API_KEY` or
  `build_llm_provider` raises) and `UnavailableLLMProvider` (the
  dev-mode default while neither is set — every LLM-backed route
  honestly 503s, same as `UnavailableIseAnalysisProvider`). One real
  route, `POST /ise/explain`, returning `{ summary }` — the exact shape
  `apps/api`'s `IseAnalysisProvider` (Phase 2) already expects, and the
  concrete target for swapping that provider once this service can
  answer for real. `docker-compose.yml` gained the `ai` service entry
  the Phase 0 plan and this file's earlier note both said would land
  here; root/`services/ai/.env.example` document `AI_PORT`,
  `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.

  Verified live: booted a real `uvicorn` process and hit it over real
  HTTP (not just FastAPI's in-process `TestClient`) — `GET /health` 200s;
  `POST /ise/explain` 401s with no/malformed/wrong-signature tokens and
  503s (with `UnavailableLLMProvider`'s exact message) with a valid token
  and no `ANTHROPIC_API_KEY` configured. 12 `pytest` tests cover the same
  cases plus `build_llm_provider`'s selection logic in isolation.
  `docker compose config` validates the new service block cleanly.
  **Not** verified: an actual `ClaudeProvider` call against the real
  Anthropic API (no key exists yet), or `apps/api` actually calling this
  service (that wiring isn't built — see below), or the Docker build
  itself (needs `python:3.12-slim` from Docker Hub, same restriction
  noted for other services in this file).

  Still blocked on the deferred input this file has named since Phase 0:
  an `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` + an agreed usage budget /
  per-plan caps. Not yet built, and not blocked on the key — just not
  done yet: wiring `apps/api`'s `IseAnalysisProvider` to actually call
  `POST /ise/explain` (the other half of "swap the provider"); the
  Student Notebook pipeline; the AI tutor chat surface; streaming
  responses; per-user usage/cost logging. See `services/ai/README.md`
  for the full breakdown.
