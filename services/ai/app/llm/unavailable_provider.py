from .provider import LLMProvider, LLMProviderUnavailableError


class UnavailableLLMProvider(LLMProvider):
    """Dev-mode default — plays the same role UnavailableIseAnalysisProvider
    plays in apps/api (which this service will eventually sit behind).
    Used whenever ANTHROPIC_API_KEY isn't configured.
    """

    async def complete(self, *, system: str, prompt: str) -> str:
        raise LLMProviderUnavailableError(
            "Engineering AI is not configured yet — set ANTHROPIC_API_KEY "
            "(and ANTHROPIC_MODEL) for services/ai (see CLAUDE.md, Phase 4)."
        )
