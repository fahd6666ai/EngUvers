# EngUvers (عالم المهندسين)

**Your Engineering Universe.** A platform for Arab engineering students and
engineers: courses and a book library (Engineering Academy / Engineering
Books), auto-graded exams (Engineering Exams), a browser-based
circuit/embedded-systems simulator (Circuit Lab, built on
[Velxio](https://github.com/davidmonterocrespo24/velxio)), an AI tutor
(in progress), skills/portfolio tracking, career tools, and monetization
(subscriptions, local vouchers, cards).

Arabic (`ar`, RTL) is the default locale; English (`en`, LTR) is secondary.

For the as-built architecture, decisions, and phase-by-phase history, see
[`CLAUDE.md`](./CLAUDE.md). For the data model and route map, see
[`docs/ERD.md`](./docs/ERD.md) and [`docs/PAGES.md`](./docs/PAGES.md).

## What's working today

Registration/login (email+password and phone OTP), the onboarding flow,
entitlements/plans, the dashboard, Engineering Academy (courses), Engineering
Books (library), Engineering Exams, and Circuit Lab all work end-to-end with
**no external API keys required**. The only feature gated on a missing
external dependency is Circuit Lab's "Explain my project" AI button
(`services/ai`), which needs an `ANTHROPIC_API_KEY` — until it's set, that
one endpoint honestly returns `503` instead of faking a response. Everything
else in the platform is unaffected.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 (`corepack enable` will pick up the pinned
  version from `package.json`)
- [Docker](https://www.docker.com/) + Docker Compose (recommended — one
  command brings up the whole stack), **or** a local PostgreSQL 16 install
  if you'd rather run the apps directly with `pnpm dev` (see
  [Option B](#option-b-without-docker) below)
- Git (with submodule support, for Circuit Lab)

## Quick start (Docker)

```bash
git clone <this-repo-url>
cd EngUvers

# Circuit Lab's Velxio submodule — one-time
git submodule update --init --recursive

cp .env.example .env

docker compose up --build
```

This brings up everything:

| Service     | URL                          | Notes                              |
|-------------|-------------------------------|-------------------------------------|
| `web`       | http://localhost:3000         | Next.js frontend                    |
| `api`       | http://localhost:4000         | NestJS backend (health: `/health`)  |
| `simulator` | http://localhost:5080         | Circuit Lab (health: `/health`)     |
| `ai`        | http://localhost:4100         | Engineering AI (health: `/health`)  |
| `postgres`  | localhost:5432                | —                                    |
| `redis`     | localhost:6379                | —                                    |
| `minio`     | http://localhost:9001         | S3-compatible object storage console |
| `meilisearch` | http://localhost:7700       | Search                              |

The database schema and seed data (reference countries, subscription plans,
a small starter set of universities/faculties, generic majors) still need to
be applied once the `postgres` container is healthy:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

Then open **http://localhost:3000** and register an account — the whole
signup → onboarding → dashboard → Academy/Library/Exams/Lab flow works
immediately.

## Option B: without Docker

If Docker (or Docker Hub access) isn't available in your environment, run
Postgres and the two Node apps directly. This is exactly how the project was
verified end-to-end during development.

```bash
# 1. A running Postgres 16, reachable on localhost:5432, with a database
#    + user matching the values below (adjust to taste).
createuser enguvers --pwprompt   # or use an existing Postgres install
createdb enguvers -O enguvers

# 2. Per-app env files (not the root .env, which is Docker-only)
cp apps/api/.env.example apps/api/.env
cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SIMULATOR_URL=http://localhost:5080
EOF
# edit apps/api/.env if your DATABASE_URL differs from the default

# 3. Install, migrate, seed
pnpm install
pnpm db:migrate
pnpm db:seed

# 4. Run apps/web + apps/api together in watch mode
pnpm dev
```

`apps/web` will be on **http://localhost:3000**, `apps/api` on
**http://localhost:4000**. Circuit Lab, `services/ai`, Redis, MinIO, and
Meilisearch aren't started this way — everything else (auth, Academy,
Library, Exams, dashboard) works without them.

## Trying it out

1. Open http://localhost:3000 — you'll land on the Arabic (RTL) home page.
2. Go through onboarding (language → country → academic info) and register
   with an email + password (or phone, via OTP — the dev-mode OTP provider
   logs the code to the `apps/api` console instead of sending a real SMS).
3. You land on the dashboard with a `free` plan auto-granted.
4. From there: **Academy** (browse/enroll in courses), **Library** (browse
   books), **Exams** (take an auto-graded multiple-choice exam), **Lab**
   (create a Circuit Lab project — needs the `simulator` service, i.e. the
   Docker path).
5. To try the content-admin panels (`/admin/academy`, `/admin/library`,
   `/admin/exams`), promote a user's `role` to `admin` or `instructor`
   directly in the database, then log in again (the role is baked into the
   JWT at login time, not re-read per request):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
   ```

## Common commands

```bash
pnpm install          # install all workspace dependencies

pnpm dev               # apps/web + apps/api in watch mode (needs Postgres/Redis reachable)
pnpm build             # build all packages/apps
pnpm lint              # turbo lint (per-package; skipped, not failed, if a package has no script)
pnpm typecheck         # turbo typecheck
pnpm test              # turbo test

pnpm db:generate        # prisma generate
pnpm db:migrate         # prisma migrate dev (creates/applies a migration)
pnpm db:seed            # prisma db seed (reference data only)
```

## Project structure

```
enguvers/
├── apps/
│   ├── web/          Next.js (App Router) + TypeScript + Tailwind + next-intl
│   ├── api/           NestJS + Prisma + PostgreSQL + Redis
│   └── mobile/        placeholder (later phase)
├── services/
│   ├── ai/            FastAPI, Claude API via LLMProvider — see services/ai/README.md
│   └── simulator/      Circuit Lab (Velxio) — see services/simulator/README.md
├── packages/
│   ├── config/        shared eslint / tsconfig / tailwind preset
│   ├── types/         shared domain types (Role, PlanCode, Entitlement*, ...)
│   └── ui/             shared RTL-aware UI primitives
├── docs/
│   ├── ERD.md          entity-relationship diagram
│   ├── PAGES.md        route map
│   └── LICENSING.md    Velxio/AGPL separation rules
└── docker-compose.yml
```

## Environment variables

The root [`.env.example`](./.env.example) documents every variable used by
`docker-compose.yml`. Per-app examples for running outside Docker:
[`apps/api/.env.example`](./apps/api/.env.example) and the `apps/web/.env.local`
snippet above. Nothing sensitive is committed — copy the `.example` files and
fill in real values locally.

Notably: `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` (optional — only needed for
`services/ai`'s LLM-backed routes; every other feature works without them),
and `JWT_SECRET` (change it for anything beyond local dev).

## Circuit Lab / Velxio licensing

Circuit Lab embeds [Velxio](https://github.com/davidmonterocrespo24/velxio)
unmodified, as a pinned git submodule, under AGPLv3 — see
[`docs/LICENSING.md`](./docs/LICENSING.md) for the full rationale and the
rules that keep it that way (never edit the submodule in place; the Bridge
lives entirely in `services/simulator/bridge-overlay/`).

## Contributing / development notes

See [`CLAUDE.md`](./CLAUDE.md) for the architecture decisions (entitlements
model, i18n conventions, auth boundaries, the swappable-provider pattern used
for OTP/AI providers) and the phase-by-phase build log.
