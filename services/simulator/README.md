# services/simulator — EngUvers Circuit Lab (Velxio integration)

**Status: placeholder — implemented in Phase 2.**

This will host our fork of [Velxio](https://github.com/davidmonterocrespo24/velxio)
(AGPLv3-licensed Arduino/embedded-systems emulator) as a git submodule,
plus a thin Bridge overlay. Full integration plan (researched against the
actual Velxio source, not assumed): see the approved Phase 0 plan and
`docs/LICENSING.md`.

Summary of the plan:

- **Fork, pinned to a commit**, not a moving `master` tracking submodule —
  `services/simulator/velxio` will point at our own fork so any AGPL
  §13-mandated "Source Code" link change is ours to control and review.
- **No changes to Velxio's core simulation/compile code.** The Bridge is
  built entirely on the extension seams Velxio already ships for this
  exact purpose: `backend/app/core/hooks.py` (10 hooks — auth resolution,
  compile recording/admission/priority, WS lifecycle, health probes),
  `frontend/src/lib/proSaveAction.ts`, `proSession.ts`, `proRoutes.ts`.
- Runs as its own container (own `docker-compose` entry, its own domain in
  production), embedded into `apps/web`'s `/[locale]/lab/circuits/[id]`
  page via `<iframe>` + `postMessage` with strict origin checks — never
  imported into `apps/web`'s bundle or `apps/api`'s process.
- Auto-gradable challenges use Velxio's own MCP server tool surface
  (`compile_project`, `create_circuit`) as the grading primitive.
- Quota/abuse control (translation cost, especially ESP32/IDF) lives in a
  reverse proxy + a short-lived per-session token `apps/api` issues,
  enforced through the `compile_admission`/`compile_priority` hooks tied
  to the central `Entitlement` system — never hardcoded plan checks.

## Why this is empty right now

Phase 0 scaffolds only what Phase 1 needs. This directory exists so the
target shape is visible from the start; the fork, submodule pin, Bridge
code, and `docs/LICENSING.md` content all land at the start of Phase 2 —
per the project rule to design before coding and to show the full diff of
any change to the fork before proceeding.
