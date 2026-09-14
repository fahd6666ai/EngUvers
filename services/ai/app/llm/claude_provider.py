from anthropic import AsyncAnthropic

from .provider import LLMProvider


class ClaudeProvider(LLMProvider):
    """The real implementation, wired to the Claude API. Never
    constructed directly outside build_llm_provider — that's what
    enforces "no hardcoded model name" (the model always comes from
    ANTHROPIC_MODEL, checked there).
    """

    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def complete(self, *, system: str, prompt: str) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")
