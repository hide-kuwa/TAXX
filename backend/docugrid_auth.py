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
DEV_JWT_SECRET = "dev-insecure-change-me"
MIN_JWT_SECRET_LEN = 32


def get_app_env() -> str:
    return os.environ.get("DOCUGRID_ENV", "development").strip().lower()


def is_production() -> bool:
    return get_app_env() in ("production", "prod")


def get_jwt_exp_hours() -> float:
    try:
        return float(os.environ.get("DOCUGRID_JWT_EXP_HOURS", "24"))
    except ValueError:
        return 24.0


def get_jwt_exp_seconds() -> int:
    return int(get_jwt_exp_hours() * 3600)

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
    return os.environ.get("DOCUGRID_JWT_SECRET", DEV_JWT_SECRET)


def jwt_secret_is_dev_default() -> bool:
    return _jwt_secret() == DEV_JWT_SECRET


def header_auth_allowed() -> bool:
    raw = os.environ.get("DOCUGRID_ALLOW_HEADER_AUTH")
    if raw is None:
        return not is_production()
    return raw.lower() in ("1", "true", "yes")


def validate_auth_config(*, strict: bool | None = None) -> list[str]:
    """
    Validate auth-related environment. In production (strict=True by default),
    raises RuntimeError on fatal misconfiguration.
    Returns non-fatal warnings for development.
    """
    if strict is None:
        strict = is_production()
    warnings: list[str] = []
    secret = _jwt_secret()

    if is_production():
        if jwt_secret_is_dev_default() or len(secret) < MIN_JWT_SECRET_LEN:
            msg = (
                f"DOCUGRID_JWT_SECRET must be set to a random value of at least "
                f"{MIN_JWT_SECRET_LEN} characters in production"
            )
            if strict:
                raise RuntimeError(msg)
            warnings.append(msg)
        if header_auth_allowed():
            msg = "DOCUGRID_ALLOW_HEADER_AUTH must be false in production"
            if strict:
                raise RuntimeError(msg)
            warnings.append(msg)
        login_pw = os.environ.get("DOCUGRID_LOGIN_PASSWORD", "password")
        if login_pw == "password":
            msg = "DOCUGRID_LOGIN_PASSWORD must not be the default in production"
            if strict:
                raise RuntimeError(msg)
            warnings.append(msg)
    elif jwt_secret_is_dev_default():
        warnings.append(
            "Using default DOCUGRID_JWT_SECRET — set a strong secret before production"
        )

    return warnings


def create_access_token(*, sub: str, role: str, stid: str) -> str:
    now = datetime.now(timezone.utc)
    exp_seconds = get_jwt_exp_seconds()
    payload = {
        "sub": sub,
        "role": role,
        "stid": stid,
        "iat": now,
        "exp": now + timedelta(seconds=exp_seconds),
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
    if header_auth_allowed():
        return (
            (request.headers.get("X-Docugrid-Role") or "").strip() or None,
            (request.headers.get("X-Docugrid-User") or "").strip() or None,
            (request.headers.get("X-Docugrid-Stakeholder") or "").strip() or None,
        )
    return (None, None, None)
