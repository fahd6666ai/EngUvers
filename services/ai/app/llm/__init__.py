from ..config import Settings
from .claude_provider import ClaudeProvider
from .provider import LLMProvider, LLMProviderUnavailableError
from .unavailable_provider import UnavailableLLMProvider


def build_llm_provider(settings: Settings) -> LLMProvider:
    """The same swappable-provider shape as apps/api's OtpProvider and
    IseAnalysisProvider: pick the real implementation when configured,
    otherwise a default that fails loudly and specifically instead of
    fabricating a response. See Settings' docstring for why a configured
    ANTHROPIC_API_KEY without ANTHROPIC_MODEL is a hard error rather than
    a silent default model choice.
    """
    if not settings.anthropic_api_key:
        return UnavailableLLMProvider()
    if not settings.anthropic_model:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is set but ANTHROPIC_MODEL is not — set it explicitly; "
            "this service never hardcodes a model name (see services/ai/README.md)."
        )
    return ClaudeProvider(api_key=settings.anthropic_api_key, model=settings.anthropic_model)


__all__ = ["LLMProvider", "LLMProviderUnavailableError", "build_llm_provider"]
