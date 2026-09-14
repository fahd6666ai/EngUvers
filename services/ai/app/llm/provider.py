from abc import ABC, abstractmethod


class LLMProviderUnavailableError(Exception):
    """Raised by a provider that can't actually answer right now —
    callers turn this into HTTP 503, never into a fabricated response.
    """


class LLMProvider(ABC):
    """One method deliberately: a single non-streaming completion.
    Each real feature (ISE analysis, Student Notebook, AI tutor chat)
    builds its own system prompt and calls this — streaming and
    multi-turn conversation state are later, feature-specific additions
    on top of this seam, not part of it.
    """

    @abstractmethod
    async def complete(self, *, system: str, prompt: str) -> str: ...
