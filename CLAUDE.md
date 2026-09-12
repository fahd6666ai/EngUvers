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
│   ├── ai/            placeholder — Phase 4 (FastAPI, Claude API via LLMProvider)
│   └── simulator/      placeholder — Phase 2 (Velxio fork + Bridge overlay)
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

# Whole stack in Docker (web, api, postgres, redis, minio, meilisearch)
docker compose up --build
# web  -> http://localhost:3000
# api  -> http://localhost:4000  (health: GET /health)

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
  (`services/simulator`, Phase 2), never vendored into `apps/web`/`apps/api`.
  Our fork is a submodule pinned to a commit SHA; the integration ("the
  Bridge") is built entirely on Velxio's own extension seams
  (`backend/app/core/hooks.py`, `proSaveAction.ts`, `proSession.ts`,
  `proRoutes.ts`) — confirmed by reading the actual Velxio source during
  Phase 0 planning, not assumed. See `docs/LICENSING.md` and
  `services/simulator/README.md`.
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
  `AuthService`.
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

Next phase to implement: **Phase 2** — Circuit Lab (Velxio fork + Bridge)
and the Project Lab shell.
