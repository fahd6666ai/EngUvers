# services/ai — Engineering AI (EAI) service

**Status: placeholder — implemented in Phase 4.**

This will be a Python (FastAPI) service handling:

- The Student Notebook pipeline: lecture upload (PDF/image/audio) →
  simplified explanation, summary, interactive mind map, review questions.
- ML-assisted tools supporting the notebook (OCR, transcription).
- The backend implementation of the `LLMProvider` abstraction described in
  the root `CLAUDE.md`, wired to the Claude API. The provider interface is
  designed to be swappable and must not hardcode a model name — it reads
  it from an environment variable.
- Streaming responses, per-plan usage caps, and cost logging, gated
  through the same central `Entitlement` system `apps/api` uses (this
  service is a resource server behind it, not a second auth system).
- The EAI ↔ Circuit Lab link (Phase 4): receiving code + compiler errors +
  circuit description from the simulator bridge and returning a
  plain-language explanation.

## Prerequisites before this phase can ship

- An `ANTHROPIC_API_KEY` and an agreed usage budget / per-plan daily caps
  (deferred from Phase 0 — see the Phase 0 plan's decisions log).

## Why this is empty right now

Phase 0 scaffolds only what Phase 1 needs (`apps/web`, `apps/api`) to avoid
carrying untouched service skeletons through three phases before they do
anything. This directory exists now so the target monorepo shape is
visible from the start; `docker-compose.yml` gains an `ai` service entry
when this phase begins.
