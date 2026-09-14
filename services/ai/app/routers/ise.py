import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from ..auth import get_current_user_id
from ..dependencies import get_llm_provider
from ..llm import LLMProvider, LLMProviderUnavailableError

router = APIRouter(prefix="/ise", tags=["ise"])

_SYSTEM_PROMPT = (
    "You are an engineering tutor explaining a student's circuit/embedded "
    "project (Velxio .vlx format: board, components, wiring, and Arduino "
    "sketch) in plain language. Be concrete about what the circuit does "
    "and point out anything that looks like a likely mistake. Keep it to "
    "a few short paragraphs."
)

# The raw vlxContent JSON can be large (full sketch source, wiring, etc.);
# bound what actually reaches the model. A real token-aware budget belongs
# to whichever future PR adds usage/cost tracking — this is a cheap
# stopgap, not that.
_MAX_PROMPT_CHARS = 8000


class ExplainRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    vlx_content: dict[str, Any] = Field(alias="vlxContent")


class ExplainResponse(BaseModel):
    summary: str


@router.post("/explain", response_model=ExplainResponse)
async def explain_project(
    body: ExplainRequest,
    user_id: str = Depends(get_current_user_id),
    provider: LLMProvider = Depends(get_llm_provider),
) -> ExplainResponse:
    """The endpoint apps/api's IseAnalysisProvider (Phase 2) will call
    once a real one replaces UnavailableIseAnalysisProvider — see
    CLAUDE.md's "Swappable provider pattern" decision. `user_id` isn't
    used yet (no per-user usage logging exists here yet either); it's
    threaded through because every route on this service takes one, per
    services/ai/README.md's "resource server behind apps/api's
    Entitlement system, not a second auth system" rule.
    """
    del user_id  # not used yet — see docstring
    prompt = json.dumps(body.vlx_content)[:_MAX_PROMPT_CHARS]
    try:
        summary = await provider.complete(system=_SYSTEM_PROMPT, prompt=prompt)
    except LLMProviderUnavailableError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    return ExplainResponse(summary=summary)
