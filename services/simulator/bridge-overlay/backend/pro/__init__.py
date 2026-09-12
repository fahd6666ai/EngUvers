"""
EngUvers Bridge — Velxio's backend `app.pro` overlay seam.

`backend/app/main.py` already does, unconditionally, on every boot:

    try:
        from app.pro import register_pro
        register_pro(app)
    except ImportError:
        pass

This package is COPYed into that exact path (`backend/app/pro/`) at
Docker build time (see services/simulator/Dockerfile) — it never lives
inside, or modifies, the `services/simulator/velxio` submodule. See
docs/LICENSING.md for why this doesn't require AGPL copyleft on this
overlay itself.

Phase 2 scope: attribute compile attempts to an EngUvers user for
logging/observability. Quota/entitlement ENFORCEMENT (compile_admission,
compile_priority) is deliberately not wired yet — there is no
circuit_lab.* PlanLimit row to enforce against until a paid-tier feature
actually needs one (same "don't seed limits ahead of the feature" rule
Phase 1 applied to the rest of the Entitlements system).
"""

import logging
import os
from typing import Any, Optional

import jwt
from fastapi import FastAPI, Request

from app.core.hooks import register_get_current_user_id, register_record_compile

logger = logging.getLogger("enguvers.bridge")

# Same secret/algorithm as apps/api's JwtModule (HS256, @nestjs/jwt's
# default). The token here is a short-lived, scope-limited one issued by
# POST /circuit-projects/:id/session-token — not the user's general
# 7-day app session token — but both are signed with the same secret, so
# decoding is identical.
JWT_SECRET = os.environ.get("JWT_SECRET", "")


async def _get_current_user_id(request: Request) -> Optional[str]:
    if not JWT_SECRET:
        return None
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer ") :]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    user_id = payload.get("sub")
    return user_id if isinstance(user_id, str) else None


async def _record_compile(
    *,
    user_id: Optional[str],
    project_id: Optional[str],
    board_fqbn: str,
    success: bool,
    duration_ms: int,
    error_kind: Optional[str],
    extra: dict,
    request: Any = None,
) -> None:
    logger.info(
        "compile user=%s board=%s success=%s duration_ms=%s error_kind=%s",
        user_id,
        board_fqbn,
        success,
        duration_ms,
        error_kind,
    )


def register_pro(app: FastAPI) -> None:
    register_get_current_user_id(_get_current_user_id)
    register_record_compile(_record_compile)
