"""
JWT-based auth for DocuGrid API.

- Issue tokens at POST /api/auth/login (implemented in main.py).
- Protected routes resolve identity from Bearer token first; optional header fallback for tests.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

JWT_ALG = "HS256"
JWT_EXP_HOURS = 24
JWT_EXP_SECONDS = int(JWT_EXP_HOURS * 3600)

# Mirrors frontend STAKEHOLDER_MASTER id -> appRoleId
STAKEHOLDER_ROLE_BY_ID: dict[str, str] = {
    "actor-admin": "admin",
    "actor-s1": "operator",
    "actor-s2": "reviewer",
    "actor-s3": "approver",
    "actor-c1": "viewer",
    "actor-b1": "viewer",
    "actor-tp1": "viewer",
    "actor-tax1": "viewer",
}


def _jwt_secret() -> str:
    return os.environ.get("DOCUGRID_JWT_SECRET", "dev-insecure-change-me")


def header_auth_allowed() -> bool:
    return os.environ.get("DOCUGRID_ALLOW_HEADER_AUTH", "true").lower() in ("1", "true", "yes")


def create_access_token(*, sub: str, role: str, stid: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "stid": stid,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALG)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def get_bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:].strip() or None


@dataclass(frozen=True)
class AuthIdentity:
    role: str
    email: str
    stakeholder_id: str


def resolve_identity(request) -> AuthIdentity:
    """
    Prefer validated JWT. If no/invalid Bearer token, allow legacy headers when
    DOCUGRID_ALLOW_HEADER_AUTH is enabled (defaults true for local/tests).
    """
    cached = getattr(request.state, "_dg_identity", None)
    if cached is not None:
        return cached

    auth_header = request.headers.get("Authorization")
    token = get_bearer_token(auth_header)
    if token:
        payload = decode_access_token(token)
        if not payload:
            from fastapi import HTTPException

            raise HTTPException(status_code=401, detail="Invalid or expired token")
        role = (payload.get("role") or "").strip()
        if not role:
            from fastapi import HTTPException

            raise HTTPException(status_code=401, detail="Invalid token payload")
        identity = AuthIdentity(
            role=role,
            email=(payload.get("sub") or "").strip(),
            stakeholder_id=(payload.get("stid") or "").strip(),
        )
        request.state._dg_identity = identity
        return identity

    if header_auth_allowed():
        role = (request.headers.get("X-Docugrid-Role") or "").strip()
        if not role:
            from fastapi import HTTPException

            raise HTTPException(status_code=401, detail="Missing authentication")
        identity = AuthIdentity(
            role=role,
            email=(request.headers.get("X-Docugrid-User") or "").strip(),
            stakeholder_id=(request.headers.get("X-Docugrid-Stakeholder") or "").strip(),
        )
        request.state._dg_identity = identity
        return identity

    from fastapi import HTTPException

    raise HTTPException(status_code=401, detail="Bearer token required")


def peek_identity_for_audit(request) -> tuple[str | None, str | None, str | None]:
    """
    Best-effort identity for audit rows. Never raises (invalid token -> header fallback).
    Used by denial logging and when avoiding re-raising inside exception handlers.
    """
    token = get_bearer_token(request.headers.get("Authorization"))
    if token:
        payload = decode_access_token(token)
        if payload:
            return (
                (payload.get("role") or "").strip() or None,
                (payload.get("sub") or "").strip() or None,
                (payload.get("stid") or "").strip() or None,
            )
    return (
        (request.headers.get("X-Docugrid-Role") or "").strip() or None,
        (request.headers.get("X-Docugrid-User") or "").strip() or None,
        (request.headers.get("X-Docugrid-Stakeholder") or "").strip() or None,
    )
