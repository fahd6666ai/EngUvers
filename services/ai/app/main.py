from fastapi import FastAPI

from .routers import ise

app = FastAPI(title="EngUvers Engineering AI (EAI)")
app.include_router(ise.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}
