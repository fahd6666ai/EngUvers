from functools import lru_cache

from .config import get_settings
from .llm import LLMProvider, build_llm_provider


@lru_cache
def get_llm_provider() -> LLMProvider:
    """A process-wide singleton, built once from settings — cheap since
    ClaudeProvider just holds an SDK client, and it means the "is
    ANTHROPIC_API_KEY set" check happens once at first use, not per
    request. Tests override this dependency directly rather than
    fighting the cache; see tests/conftest.py.
    """
    return build_llm_provider(get_settings())
