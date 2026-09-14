from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven config — see services/ai/.env.example. Nothing here is
    hardcoded (in particular the model name, per the constraint in
    services/ai/README.md): ANTHROPIC_MODEL must be set explicitly
    alongside ANTHROPIC_API_KEY, or the app refuses to build a real
    provider rather than silently picking one — see
    app.llm.get_llm_provider.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Same secret + algorithm (HS256) as apps/api's JwtModule, so tokens
    # apps/api issues verify here too — this service has no auth system
    # of its own, per services/ai/README.md.
    jwt_secret: str = "change-me-in-production"

    anthropic_api_key: str | None = None
    anthropic_model: str | None = None

    ai_port: int = 4100


@lru_cache
def get_settings() -> Settings:
    return Settings()
