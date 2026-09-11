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
  reference/configuration data (countries, plans) — no placeholder users,
  universities, or content.

## Phase Log

- **Phase 0 (current)** — Monorepo scaffolding: `apps/web` (Next.js +
  next-intl RTL placeholder landing page), `apps/api` (NestJS + Prisma
  schema covering users/roles/academic-structure/entitlements/vouchers/
  skills, seeded with countries + plans), shared `packages/*`,
  `docker-compose.yml`, CI (lint/typecheck/prisma validate/test),
  `docs/ERD.md` + `docs/PAGES.md`, and this file. `services/ai`,
  `services/simulator`, `apps/mobile` are placeholders only — implemented
  in Phases 4, 2, and 8 respectively.

  Deferred inputs (not blockers for Phase 0, needed later):
  - Anthropic API key + usage budget/per-tier caps — before Phase 4 ships.
  - Jeeb (or other regional e-wallet) API credentials/docs — before
    Phase 6's voucher-provider adapter ships; the voucher engine itself is
    provider-agnostic and doesn't wait on this.
  - A real university/faculty/major/curriculum dataset — content task for
    whichever phase starts populating it (Phase 1 onboarding needs at
    least a small real seed, not fabricated placeholder data).

Next phase to implement: **Phase 1** — design system (RTL), landing page,
onboarding (language/country/academic), auth + roles, dashboard,
Entitlements model made real (API routes + guards).
