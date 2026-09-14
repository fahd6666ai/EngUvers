import pytest

from app.config import Settings
from app.llm import build_llm_provider
from app.llm.claude_provider import ClaudeProvider
from app.llm.provider import LLMProviderUnavailableError
from app.llm.unavailable_provider import UnavailableLLMProvider


def test_no_api_key_returns_unavailable_provider():
    settings = Settings(anthropic_api_key=None, anthropic_model=None)
    assert isinstance(build_llm_provider(settings), UnavailableLLMProvider)


def test_api_key_without_model_raises_instead_of_guessing_one():
    settings = Settings(anthropic_api_key="sk-ant-test", anthropic_model=None)
    with pytest.raises(RuntimeError, match="ANTHROPIC_MODEL"):
        build_llm_provider(settings)


def test_api_key_with_model_returns_claude_provider():
    settings = Settings(anthropic_api_key="sk-ant-test", anthropic_model="claude-test-model")
    provider = build_llm_provider(settings)
    assert isinstance(provider, ClaudeProvider)


@pytest.mark.asyncio
async def test_unavailable_provider_raises_specific_error():
    with pytest.raises(LLMProviderUnavailableError, match="ANTHROPIC_API_KEY"):
        await UnavailableLLMProvider().complete(system="s", prompt="p")
