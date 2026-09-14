# services/ai — Engineering AI (EAI) service

**Status: Phase 4 scaffolding is in place. Real LLM output is blocked on
an `ANTHROPIC_API_KEY` — see "What's deferred" below.**

A standalone Python (FastAPI) service. It trusts the same JWTs `apps/api`
issues (HS256, shared `JWT_SECRET`, `sub` claim) — see `app/auth.py` —
rather than running a second auth or entitlement system; this service is
a resource server that sits behind `apps/api`, gated through the same
central `Entitlement` system (`apps/api`'s `EntitlementsGuard`) before a
request ever reaches it.

## What's built

- **`LLMProvider`** (`app/llm/provider.py`) — a one-method abstraction
  (`complete(system, prompt) -> str`), the same swappable-provider shape
  as `apps/api`'s `OtpProvider` and `IseAnalysisProvider`.
  - `ClaudeProvider` (`app/llm/claude_provider.py`) — the real
    implementation, wired to the Anthropic SDK. Never hardcodes a model:
    `ANTHROPIC_MODEL` is required alongside `ANTHROPIC_API_KEY`, or
    `build_llm_provider` raises rather than guessing one.
  - `UnavailableLLMProvider` (`app/llm/unavailable_provider.py`) — the
    dev-mode default when `ANTHROPIC_API_KEY` isn't set. Raises
    `LLMProviderUnavailableError`, which routes turn into a real HTTP 503
    — never a fabricated response.
- **`POST /ise/explain`** (`app/routers/ise.py`) — the one real endpoint
  in this slice, and the concrete target `apps/api`'s
  `IseAnalysisProvider` (Phase 2, currently `UnavailableIseAnalysisProvider`)
  is meant to call once a real HTTP-backed implementation replaces it.
  Takes a project's `vlxContent`, returns `{ "summary": string }` —
  the same shape Phase 2 already defined. Entitlement-gated by `apps/api`
  before the request ever reaches here; this route itself only checks
  that the bearer token is valid.
- **`GET /health`** — public, no auth.

## What's deferred

- An `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` + an agreed usage budget /
  per-plan daily caps (deferred from Phase 0 — see the root `CLAUDE.md`'s
  Phase Log). Until then `ClaudeProvider` is never constructed;
  `UnavailableLLMProvider` answers every LLM-backed route with an honest
  503.
- Wiring `apps/api`'s `IseAnalysisProvider` to actually call
  `POST /ise/explain` over HTTP — that's the other half of "swap the
  provider," and doesn't need to happen until this service can answer
  for real.
- The Student Notebook pipeline (lecture upload → simplified explanation,
  summary, mind map, review questions), OCR/transcription, the AI tutor
  chat surface, streaming responses, and per-user usage/cost logging —
  none of these exist yet. Each is a real product surface of its own,
  not something to bolt onto this scaffolding speculatively.
- The EAI ↔ Circuit Lab link beyond `/ise/explain` (richer context: full
  compiler errors, wiring diagrams).

## Running it

```bash
# From services/ai/
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY/ANTHROPIC_MODEL if you have them

uvicorn app.main:app --reload --port 4100
pytest                 # 12 tests, all pass with no ANTHROPIC_API_KEY set
```

Or via the root dev stack: `docker compose up ai` (needs Docker Hub
reachable for the `python:3.12-slim` base image — blocked in some
sandboxes, same restriction noted elsewhere in `CLAUDE.md`).

## Verified

Live-tested (real `uvicorn` process, real HTTP, no mocking) in the same
session this was built: `GET /health` returns 200; `POST /ise/explain`
returns 401 with no token, 401 with a malformed or wrong-signature token,
and 503 (with the exact `UnavailableLLMProvider` message) with a valid
token and no `ANTHROPIC_API_KEY` configured. `pytest` (12 tests) covers
the same cases plus the provider-selection logic in isolation
(`ANTHROPIC_API_KEY` set without `ANTHROPIC_MODEL` raises rather than
picking a default model). **Not** verified: an actual `ClaudeProvider`
call against the real Anthropic API — no key is available yet.
