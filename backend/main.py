import base64
import csv
import hashlib
import io
import json
import logging
import os
import sqlite3
import urllib.parse
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import fitz  # PyMuPDF
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

from services.pdf_annotations import (
    delete_annots_intersecting,
    draw_freehand_eraser,
    draw_freehand_marker,
    parse_norm_path_json,
    path_bbox_rect,
)

from docugrid_auth import (
    STAKEHOLDER_ROLE_BY_ID,
    create_access_token,
    get_jwt_exp_seconds,
    peek_identity_for_audit,
    resolve_identity,
    validate_auth_config,
)
from database import init_db
from schemas.docugrid_persist import DocugridSaveRequest
from schemas.order_payload import OrderPayload
from services.ai_classifier import ai_classify_boost, gemini_classify_boost
from services.ai_secrets import configured_flags, get_gemini_key, get_openai_key, update_secrets
from services.doc_classifier import classify_pdf
from services.document_version_service import (
    create_document_version,
    ensure_logical_document,
    get_logical_by_slot,
    get_version,
    init_document_versions_db,
    list_versions,
    mark_approved,
    mark_remanded,
    set_logical_status,
    slot_status_map,
    version_file_path,
)
from services.docugrid_persist_service import load_workspace, save_workspace
from services.merge_order_service import merge_pdf_bytes_from_order_payload
from services.requirements import compute_period_status, period_type

app = FastAPI()


@app.on_event("startup")
def _startup_init_db() -> None:
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    """ブラウザで http://127.0.0.1:8000/ を開いたときに 404 にならないようにする。"""
    return {
        "ok": True,
        "service": "DocuGrid API",
        "docs": "/docs",
        "health": "/health",
        "api": "/api",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_LINKS_DB_PATH = STORAGE_DIR / "audit_links.db"
AUDIT_EVENTS_DB_PATH = STORAGE_DIR / "audit_events.db"
SYSTEM_CONFIG_PATH = STORAGE_DIR / "system_config.json"
CLIENT_MASTER_PATH = STORAGE_DIR / "client_master.json"
STAKEHOLDER_MASTER_PATH = STORAGE_DIR / "stakeholder_master.json"
SLOT_DOCS_DB_PATH = STORAGE_DIR / "slot_documents.db"
SLOT_FILES_DIR = STORAGE_DIR / "slots"
SLOT_FILES_DIR.mkdir(parents=True, exist_ok=True)
REVIEW_EVENTS_DB_PATH = STORAGE_DIR / "review_events.db"

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "viewer": {"client.view", "document.view", "dashboard.view"},
    "operator": {
        "client.view",
        "client.edit",
        "document.view",
        "document.upload",
        "document.annotate",
        "document.comment",
        "audit.link",
        "dashboard.view",
        "alert.view",
    },
    "reviewer": {
        "client.view",
        "document.view",
        "document.annotate",
        "document.comment",
        "audit.link",
        "dashboard.view",
        "alert.view",
    },
    "approver": {"client.view", "document.view", "audit.link", "audit.approve", "dashboard.view", "alert.view"},
    "admin": {
        "client.view",
        "client.edit",
        "document.view",
        "document.upload",
        "document.annotate",
        "document.comment",
        "audit.link",
        "audit.approve",
        "dashboard.view",
        "alert.view",
        "alert.manage",
        "settings.manage",
    },
}

DEFAULT_STAKEHOLDER_CLIENT_SCOPES: dict[str, set[str]] = {
    "actor-s1": {"c1", "c2", "c3"},
    "actor-s2": {"c4", "c5"},
    "actor-s3": {"c1", "c2", "c3", "c4", "c5"},
    "actor-c1": {"c1"},
    "actor-b1": {"c1"},
    "actor-tp1": {"c2"},
    "actor-tax1": {"c1", "c2", "c3", "c4", "c5"},
}

_stakeholder_maps_cache: tuple[dict[str, str], dict[str, set[str]]] | None = None


def _invalidate_stakeholder_maps_cache() -> None:
    global _stakeholder_maps_cache
    _stakeholder_maps_cache = None


def _get_stakeholder_merged_maps() -> tuple[dict[str, str], dict[str, set[str]]]:
    global _stakeholder_maps_cache
    if _stakeholder_maps_cache is not None:
        return _stakeholder_maps_cache
    roles = dict(STAKEHOLDER_ROLE_BY_ID)
    scopes = {k: set(v) for k, v in DEFAULT_STAKEHOLDER_CLIENT_SCOPES.items()}
    if STAKEHOLDER_MASTER_PATH.exists():
        try:
            raw = json.loads(STAKEHOLDER_MASTER_PATH.read_text(encoding="utf-8"))
            for k, v in (raw.get("roleByStakeholderId") or {}).items():
                if isinstance(k, str) and isinstance(v, str):
                    roles[k] = v
            for k, v in (raw.get("clientScopesByStakeholderId") or {}).items():
                if isinstance(k, str) and isinstance(v, list):
                    scopes[k] = {str(x) for x in v}
        except Exception:
            pass
    _stakeholder_maps_cache = (roles, scopes)
    return _stakeholder_maps_cache


def _get_stakeholder_role_map() -> dict[str, str]:
    return _get_stakeholder_merged_maps()[0]


def _get_stakeholder_client_scope_map() -> dict[str, set[str]]:
    return _get_stakeholder_merged_maps()[1]


def _require_permission(request: Request, required_permission: str) -> str:
    identity = resolve_identity(request)
    permissions = ROLE_PERMISSIONS.get(identity.role, set())
    if required_permission not in permissions:
        raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")
    return identity.role


def _require_client_scope(request: Request, role: str) -> str:
    identity = resolve_identity(request)
    client_id = (request.headers.get("X-Docugrid-Client") or "").strip()
    if role == "admin":
        return client_id
    stakeholder_id = identity.stakeholder_id
    if not stakeholder_id or not client_id:
        raise HTTPException(status_code=401, detail="Missing stakeholder/client scope")
    allowed = _get_stakeholder_client_scope_map().get(stakeholder_id, set())
    if client_id not in allowed:
        raise HTTPException(status_code=403, detail="Client scope denied")
    return client_id


def _require_client_access(request: Request, role: str, client_id: str) -> None:
    """Verify the caller may act on an explicit client_id (not the header scope)."""
    if role == "admin":
        return
    identity = resolve_identity(request)
    stakeholder_id = identity.stakeholder_id
    if not stakeholder_id or not client_id:
        raise HTTPException(status_code=401, detail="Missing stakeholder/client scope")
    allowed = _get_stakeholder_client_scope_map().get(stakeholder_id, set())
    if client_id not in allowed:
        raise HTTPException(status_code=403, detail="Client scope denied")


def _format_http_detail(detail: object) -> str:
    if isinstance(detail, str):
        return detail
    try:
        return json.dumps(detail, ensure_ascii=False)
    except Exception:
        return str(detail)


def _log_audit_event(request: Request, action: str, result: str, detail: str = "") -> None:
    identity = resolve_identity(request)
    with sqlite3.connect(AUDIT_EVENTS_DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO audit_events (
                created_at, stakeholder_id, user_email, role, client_id, path, action, result, detail, http_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (
                datetime.utcnow().isoformat(),
                identity.stakeholder_id or "",
                identity.email or "",
                identity.role,
                (request.headers.get("X-Docugrid-Client") or "").strip(),
                str(request.url.path),
                action,
                result,
                detail,
            ),
        )


def _log_audit_denial(request: Request, status_code: int, detail: str) -> None:
    if getattr(request.state, "_audit_denial_logged", False):
        return
    request.state._audit_denial_logged = True
    role, email, stid = peek_identity_for_audit(request)
    with sqlite3.connect(AUDIT_EVENTS_DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO audit_events (
                created_at, stakeholder_id, user_email, role, client_id, path, action, result, detail, http_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.utcnow().isoformat(),
                stid or "",
                email or "",
                role or "",
                (request.headers.get("X-Docugrid-Client") or "").strip() or None,
                str(request.url.path),
                "access.denied",
                "denied",
                detail,
                status_code,
            ),
        )


class FileInfo(BaseModel):
    id: str
    name: str
    updated_at: str
    url: str


class AuditPoint(BaseModel):
    side: str
    page: int
    x: float
    y: float
    fileName: str | None = None
    fileHash: str | None = None


class AuditLink(BaseModel):
    id: str
    createdAt: str
    createdBy: str | None = None
    comment: str | None = None
    left: AuditPoint
    right: AuditPoint


class SystemConfigPayload(BaseModel):
    google_drive_connected: bool = False
    notification_email_enabled: bool = True
    ocr_auto_extract_enabled: bool = True
    alert_consumption_tax_months_before_due: int = 2
    alert_corporate_tax_months_before_due: int = 2
    ai_openai_enabled: bool = False
    ai_openai_model: str = "gpt-4o-mini"
    ai_openai_key_configured: bool = False
    ai_gemini_enabled: bool = False
    ai_gemini_model: str = "gemini-2.0-flash"
    ai_gemini_key_configured: bool = False
    updated_at: str | None = None


class SystemConfigUpdateBody(BaseModel):
    google_drive_connected: bool = False
    notification_email_enabled: bool = True
    ocr_auto_extract_enabled: bool = True
    alert_consumption_tax_months_before_due: int = 2
    alert_corporate_tax_months_before_due: int = 2
    ai_openai_enabled: bool = False
    ai_openai_model: str = "gpt-4o-mini"
    ai_gemini_enabled: bool = False
    ai_gemini_model: str = "gemini-2.0-flash"
    ai_openai_api_key: Optional[str] = None
    ai_gemini_api_key: Optional[str] = None
    clear_ai_openai_key: bool = False
    clear_ai_gemini_key: bool = False


class ClientMasterClient(BaseModel):
    id: str
    name: str
    fiscalMonth: int
    category: str
    tags: list[str] = []


class ClientMasterGroup(BaseModel):
    id: str
    name: str
    relationType: str
    clientIds: list[str]
    note: str | None = None


class ClientMasterPayload(BaseModel):
    clients: list[ClientMasterClient]
    groups: list[ClientMasterGroup]
    updated_at: str | None = None


class StakeholderMasterPayload(BaseModel):
    roleByStakeholderId: dict[str, str]
    clientScopesByStakeholderId: dict[str, list[str]]
    updated_at: str | None = None


class AuditEventItem(BaseModel):
    id: int
    created_at: str
    stakeholder_id: str | None = None
    user_email: str | None = None
    role: str | None = None
    client_id: str | None = None
    path: str
    action: str
    result: str
    detail: str | None = None
    http_status: int | None = None


class LoginRequest(BaseModel):
    email: str
    password: str
    stakeholder_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MeResponse(BaseModel):
    email: str
    role: str
    stakeholder_id: str


def _get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(AUDIT_LINKS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_audit_links_db() -> None:
    with _get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_links (
                version_id TEXT NOT NULL,
                link_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                left_side TEXT NOT NULL,
                left_page INTEGER NOT NULL,
                left_x REAL NOT NULL,
                left_y REAL NOT NULL,
                left_file_name TEXT,
                left_file_hash TEXT,
                right_side TEXT NOT NULL,
                right_page INTEGER NOT NULL,
                right_x REAL NOT NULL,
                right_y REAL NOT NULL,
                right_file_name TEXT,
                right_file_hash TEXT,
                created_by TEXT,
                PRIMARY KEY (version_id, link_id)
            )
            """
        )
        columns = {row["name"] for row in conn.execute("PRAGMA table_info(audit_links)").fetchall()}
        if "left_file_hash" not in columns:
            conn.execute("ALTER TABLE audit_links ADD COLUMN left_file_hash TEXT")
        if "right_file_hash" not in columns:
            conn.execute("ALTER TABLE audit_links ADD COLUMN right_file_hash TEXT")
        if "created_by" not in columns:
            conn.execute("ALTER TABLE audit_links ADD COLUMN created_by TEXT")
        if "comment" not in columns:
            conn.execute("ALTER TABLE audit_links ADD COLUMN comment TEXT")


def _init_audit_events_db() -> None:
    with sqlite3.connect(AUDIT_EVENTS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                stakeholder_id TEXT,
                user_email TEXT,
                role TEXT,
                client_id TEXT,
                path TEXT NOT NULL,
                action TEXT NOT NULL,
                result TEXT NOT NULL,
                detail TEXT,
                http_status INTEGER
            )
            """
        )
        columns = {row[1] for row in conn.execute("PRAGMA table_info(audit_events)").fetchall()}
        if "http_status" not in columns:
            conn.execute("ALTER TABLE audit_events ADD COLUMN http_status INTEGER")


def _init_review_events_db() -> None:
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS review_events (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                period_key TEXT NOT NULL,
                slot_id TEXT NOT NULL,
                content_sha256 TEXT,
                version_label TEXT,
                event_type TEXT NOT NULL,
                status TEXT,
                action_title TEXT,
                reason TEXT,
                actor_stakeholder_id TEXT,
                actor_email TEXT,
                actor_role TEXT,
                is_major INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        for col in ("logical_document_id", "document_version_id", "detail"):
            try:
                conn.execute(f"ALTER TABLE review_events ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_review_events_slot
                ON review_events (client_id, period_key, slot_id, created_at DESC)
            """
        )


def _init_slot_documents_db() -> None:
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS slot_documents (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                period_key TEXT NOT NULL,
                slot_id TEXT NOT NULL,
                slot_label TEXT,
                original_name TEXT NOT NULL,
                storage_key TEXT NOT NULL,
                page_count INTEGER,
                content_sha256 TEXT NOT NULL,
                byte_size INTEGER NOT NULL,
                uploaded_by TEXT,
                uploaded_at TEXT NOT NULL,
                logical_document_id TEXT,
                current_version_id TEXT,
                UNIQUE (client_id, period_key, slot_id)
            )
            """
        )
        for col in ("logical_document_id", "current_version_id", "docugrid_document_id"):
            try:
                conn.execute(f"ALTER TABLE slot_documents ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass


def _link_docugrid_to_slot(client_id: str, period_key: str, slot_id: str, document_id: str) -> None:
    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.execute(
            """
            UPDATE slot_documents
            SET docugrid_document_id=?
            WHERE client_id=? AND period_key=? AND slot_id=?
            """,
            (document_id, client_id, period_key, slot_id),
        )


def _load_system_config() -> SystemConfigPayload:
    if not SYSTEM_CONFIG_PATH.exists():
        base = SystemConfigPayload(google_drive_connected=False, updated_at=None)
    else:
        try:
            data = json.loads(SYSTEM_CONFIG_PATH.read_text(encoding="utf-8"))
            base = SystemConfigPayload(**{k: v for k, v in data.items() if k in SystemConfigPayload.model_fields})
        except Exception:
            base = SystemConfigPayload(google_drive_connected=False, updated_at=None)
    flags = configured_flags()
    return base.model_copy(update=flags)


def _save_system_config(body: SystemConfigUpdateBody) -> SystemConfigPayload:
    update_secrets(
        openai_api_key=body.ai_openai_api_key,
        gemini_api_key=body.ai_gemini_api_key,
        clear_openai=body.clear_ai_openai_key,
        clear_gemini=body.clear_ai_gemini_key,
    )
    next_payload = SystemConfigPayload(
        google_drive_connected=body.google_drive_connected,
        notification_email_enabled=body.notification_email_enabled,
        ocr_auto_extract_enabled=body.ocr_auto_extract_enabled,
        alert_consumption_tax_months_before_due=body.alert_consumption_tax_months_before_due,
        alert_corporate_tax_months_before_due=body.alert_corporate_tax_months_before_due,
        ai_openai_enabled=body.ai_openai_enabled,
        ai_openai_model=body.ai_openai_model or "gpt-4o-mini",
        ai_gemini_enabled=body.ai_gemini_enabled,
        ai_gemini_model=body.ai_gemini_model or "gemini-2.0-flash",
        updated_at=datetime.utcnow().isoformat(),
        **configured_flags(),
    )
    store = next_payload.model_dump(exclude={"ai_openai_key_configured", "ai_gemini_key_configured"})
    SYSTEM_CONFIG_PATH.write_text(json.dumps(store, indent=2, ensure_ascii=False), encoding="utf-8")
    return next_payload


def _default_client_master() -> ClientMasterPayload:
    return ClientMasterPayload(
        clients=[
            ClientMasterClient(id="c1", name="株式会社 鈴木商店", fiscalMonth=3, category="corporate", tags=["製造"]),
            ClientMasterClient(id="c2", name="合同会社 テック", fiscalMonth=12, category="corporate", tags=["IT"]),
            ClientMasterClient(id="c3", name="佐藤商事", fiscalMonth=9, category="corporate", tags=["卸売"]),
            ClientMasterClient(id="c4", name="鈴木 太郎 (個人)", fiscalMonth=12, category="individual", tags=["個人事業"]),
            ClientMasterClient(id="c5", name="山田不動産", fiscalMonth=12, category="corporate", tags=["不動産"]),
        ],
        groups=[
            ClientMasterGroup(id="g1", name="鈴木グループ", relationType="group_company", clientIds=["c1", "c2"], note="グループ会社として連結管理"),
            ClientMasterGroup(id="g2", name="鈴木家資産管理", relationType="relative_group", clientIds=["c1", "c4"], note="親族保有資産・個人事業を含む"),
            ClientMasterGroup(id="g3", name="山田不動産 株主関係", relationType="shareholder", clientIds=["c5", "c3"], note="主要株主の関連先を監視"),
        ],
        updated_at=None,
    )


def _load_client_master() -> ClientMasterPayload:
    if not CLIENT_MASTER_PATH.exists():
        return _default_client_master()
    try:
        data = json.loads(CLIENT_MASTER_PATH.read_text(encoding="utf-8"))
        return ClientMasterPayload(**data)
    except Exception:
        return _default_client_master()


def _save_client_master(payload: ClientMasterPayload) -> ClientMasterPayload:
    next_payload = ClientMasterPayload(
        clients=payload.clients,
        groups=payload.groups,
        updated_at=datetime.utcnow().isoformat(),
    )
    CLIENT_MASTER_PATH.write_text(next_payload.model_dump_json(indent=2), encoding="utf-8")
    return next_payload


def _validate_client_master(payload: ClientMasterPayload) -> None:
    ids = [c.id for c in payload.clients]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Duplicate client id")
    id_set = set(ids)
    gids = [g.id for g in payload.groups]
    if len(gids) != len(set(gids)):
        raise HTTPException(status_code=400, detail="Duplicate group id")
    for c in payload.clients:
        if not (c.id or "").strip():
            raise HTTPException(status_code=400, detail="Client id must not be empty")
        if not (c.name or "").strip():
            raise HTTPException(status_code=400, detail="Client name must not be empty")
        if not 1 <= c.fiscalMonth <= 12:
            raise HTTPException(
                status_code=400,
                detail=f"Client {c.id!r} fiscalMonth must be between 1 and 12",
            )
    for g in payload.groups:
        if not (g.id or "").strip():
            raise HTTPException(status_code=400, detail="Group id must not be empty")
        for cid in g.clientIds:
            if cid not in id_set:
                raise HTTPException(
                    status_code=400,
                    detail=f"Group {g.id!r} references unknown client {cid!r}",
                )


def _validate_stakeholder_master(payload: StakeholderMasterPayload) -> None:
    known_roles = set(ROLE_PERMISSIONS.keys())
    for sid, role in payload.roleByStakeholderId.items():
        if role not in known_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role {role!r} for stakeholder {sid!r}",
            )
    cm = _load_client_master()
    valid_ids = {c.id for c in cm.clients}
    for sid, cids in payload.clientScopesByStakeholderId.items():
        for cid in cids:
            if cid not in valid_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown client id {cid!r} in scope for {sid!r}",
                )


def _save_stakeholder_master(payload: StakeholderMasterPayload) -> StakeholderMasterPayload:
    _validate_stakeholder_master(payload)
    next_payload = StakeholderMasterPayload(
        roleByStakeholderId=payload.roleByStakeholderId,
        clientScopesByStakeholderId=payload.clientScopesByStakeholderId,
        updated_at=datetime.utcnow().isoformat(),
    )
    STAKEHOLDER_MASTER_PATH.write_text(next_payload.model_dump_json(indent=2), encoding="utf-8")
    _invalidate_stakeholder_maps_cache()
    return next_payload


@app.get("/api/system-config", response_model=SystemConfigPayload)
async def get_system_config(request: Request):
    role = _require_permission(request, "settings.manage")
    payload = _load_system_config()
    _log_audit_event(request, "system_config.get", "success")
    return payload


@app.put("/api/system-config", response_model=SystemConfigPayload)
async def update_system_config(request: Request, payload: SystemConfigUpdateBody):
    role = _require_permission(request, "settings.manage")
    if payload.alert_consumption_tax_months_before_due < 0 or payload.alert_corporate_tax_months_before_due < 0:
        raise HTTPException(status_code=400, detail="Alert months must be non-negative")
    saved = _save_system_config(payload)
    _log_audit_event(
        request,
        "system_config.put",
        "success",
        f"drive={saved.google_drive_connected} ocr={saved.ocr_auto_extract_enabled} ai_openai={saved.ai_openai_enabled}",
    )
    return saved


@app.get("/api/client-master", response_model=ClientMasterPayload)
async def get_client_master(request: Request):
    # 全ロール（viewer 含む）が顧客名・関係グループを参照できる必要があるため client.view で許可。
    # 編集（PUT）は settings.manage のまま。
    role = _require_permission(request, "client.view")
    payload = _load_client_master()
    _log_audit_event(request, "client_master.get", "success", f"clients={len(payload.clients)}")
    return payload


@app.put("/api/client-master", response_model=ClientMasterPayload)
async def update_client_master(request: Request, payload: ClientMasterPayload):
    role = _require_permission(request, "settings.manage")
    _validate_client_master(payload)
    saved = _save_client_master(payload)
    _log_audit_event(request, "client_master.put", "success", f"clients={len(saved.clients)} groups={len(saved.groups)}")
    return saved


@app.get("/api/stakeholder-master", response_model=StakeholderMasterPayload)
async def get_stakeholder_master(request: Request):
    role = _require_permission(request, "settings.manage")
    _require_client_scope(request, role)
    roles = _get_stakeholder_role_map()
    scopes_raw = _get_stakeholder_client_scope_map()
    scopes_out = {k: sorted(v) for k, v in scopes_raw.items()}
    updated_at: str | None = None
    if STAKEHOLDER_MASTER_PATH.exists():
        try:
            raw = json.loads(STAKEHOLDER_MASTER_PATH.read_text(encoding="utf-8"))
            updated_at = raw.get("updated_at")
        except Exception:
            pass
    payload = StakeholderMasterPayload(
        roleByStakeholderId=roles,
        clientScopesByStakeholderId=scopes_out,
        updated_at=updated_at,
    )
    _log_audit_event(request, "stakeholder_master.get", "success", f"stakeholders={len(roles)}")
    return payload


@app.put("/api/stakeholder-master", response_model=StakeholderMasterPayload)
async def update_stakeholder_master(request: Request, payload: StakeholderMasterPayload):
    role = _require_permission(request, "settings.manage")
    _require_client_scope(request, role)
    saved = _save_stakeholder_master(payload)
    _log_audit_event(
        request,
        "stakeholder_master.put",
        "success",
        f"stakeholders={len(saved.roleByStakeholderId)}",
    )
    return saved


@app.post("/api/auth/login", response_model=TokenResponse)
async def auth_login(body: LoginRequest, request: Request):
    expected = os.environ.get("DOCUGRID_LOGIN_PASSWORD", "password")
    if body.password != expected:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    temp_admin_email = os.environ.get("DOCUGRID_TEMP_ADMIN_EMAIL", "admin@tax.co.jp").strip().lower()
    requested_email = body.email.strip().lower()

    resolved_stakeholder_id = body.stakeholder_id
    role = _get_stakeholder_role_map().get(resolved_stakeholder_id)
    if requested_email == temp_admin_email:
        # Temporary shortcut for local verification: this account always gets full permissions.
        resolved_stakeholder_id = "actor-admin"
        role = "admin"

    if not role:
        raise HTTPException(status_code=400, detail="Unknown stakeholder")
    token = create_access_token(sub=body.email, role=role, stid=resolved_stakeholder_id)
    _init_audit_events_db()
    with sqlite3.connect(AUDIT_EVENTS_DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO audit_events (
                created_at, stakeholder_id, user_email, role, client_id, path, action, result, detail, http_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (
                datetime.utcnow().isoformat(),
                resolved_stakeholder_id,
                body.email,
                role,
                "",
                str(request.url.path),
                "auth.login",
                "success",
                "",
            ),
        )
    return TokenResponse(access_token=token, expires_in=get_jwt_exp_seconds())


@app.get("/api/auth/me", response_model=MeResponse)
async def auth_me(request: Request):
    identity = resolve_identity(request)
    return MeResponse(email=identity.email, role=identity.role, stakeholder_id=identity.stakeholder_id)


@app.get("/api/audit-events", response_model=List[AuditEventItem])
async def list_audit_events(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    from_ts: Optional[str] = None,
    to_ts: Optional[str] = None,
    client_id: Optional[str] = None,
    stakeholder_id: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = Query(
        None,
        description="success, denied, or omit for all",
    ),
    path_contains: Optional[str] = None,
    http_status: Optional[int] = Query(None, ge=100, le=599),
):
    role = _require_permission(request, "settings.manage")
    _require_client_scope(request, role)
    _init_audit_events_db()
    clauses: list[str] = ["1=1"]
    params: list[object] = []
    if http_status is not None:
        clauses.append("http_status = ?")
        params.append(http_status)
    if from_ts:
        clauses.append("created_at >= ?")
        params.append(from_ts)
    if to_ts:
        clauses.append("created_at <= ?")
        params.append(to_ts)
    if client_id:
        clauses.append("client_id = ?")
        params.append(client_id)
    if stakeholder_id:
        clauses.append("stakeholder_id = ?")
        params.append(stakeholder_id)
    if action:
        clauses.append("action LIKE ?")
        params.append(f"%{action}%")
    if result in ("success", "denied"):
        clauses.append("result = ?")
        params.append(result)
    if path_contains:
        clauses.append("path LIKE ?")
        params.append(f"%{path_contains}%")

    where_sql = " AND ".join(clauses)
    sql = f"""
        SELECT id, created_at, stakeholder_id, user_email, role, client_id, path, action, result, detail, http_status
        FROM audit_events
        WHERE {where_sql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    with sqlite3.connect(AUDIT_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(sql, params).fetchall()
    items = [
        AuditEventItem(
            id=int(row["id"]),
            created_at=str(row["created_at"]),
            stakeholder_id=row["stakeholder_id"],
            user_email=row["user_email"],
            role=row["role"],
            client_id=row["client_id"],
            path=str(row["path"]),
            action=str(row["action"]),
            result=str(row["result"]),
            detail=row["detail"],
            http_status=row["http_status"],
        )
        for row in rows
    ]
    _log_audit_event(request, "audit_events.list", "success", f"rows={len(items)}")
    return items


@app.exception_handler(HTTPException)
async def audit_aware_http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code in (401, 403):
        _init_audit_events_db()
        _log_audit_denial(request, exc.status_code, _format_http_detail(exc.detail))
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/files", response_model=List[FileInfo])
async def list_files(request: Request):
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    files: List[FileInfo] = []
    for file_path in sorted(STORAGE_DIR.glob("*.pdf")):
        stat = file_path.stat()
        updated_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
        encoded_name = urllib.parse.quote(file_path.name)
        files.append(
            FileInfo(
                id=file_path.stem,
                name=file_path.name,
                updated_at=updated_at,
                url=f"{str(request.base_url).rstrip('/')}/files/{encoded_name}",
            )
        )
    _log_audit_event(request, "files.list", "success", f"count={len(files)}")
    return files


@app.get("/files/{filename}")
async def get_file(filename: str, request: Request):
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    decoded_name = urllib.parse.unquote(filename)
    file_path = (STORAGE_DIR / decoded_name).resolve()
    if not file_path.exists() or file_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="File not found")
    if STORAGE_DIR.resolve() not in file_path.parents:
        raise HTTPException(status_code=400, detail="Invalid file path")
    return FileResponse(file_path, media_type="application/pdf", filename=file_path.name)


@app.get("/api/audit-links/{version_id}", response_model=List[AuditLink])
async def list_audit_links(version_id: str, request: Request):
    # audit links are part of document review workflow
    # allow anyone who can view documents
    # role is required to avoid bypass from anonymous calls
    # this keeps backend and frontend permissions aligned
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    with _get_db_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                link_id, created_at,
                left_side, left_page, left_x, left_y, left_file_name,
                left_file_hash,
                right_side, right_page, right_x, right_y, right_file_name,
                right_file_hash,
                created_by, comment
            FROM audit_links
            WHERE version_id = ?
            ORDER BY created_at ASC, link_id ASC
            """,
            (version_id,),
        ).fetchall()

    result = [
        AuditLink(
            id=row["link_id"],
            createdAt=row["created_at"],
            left=AuditPoint(
                side=row["left_side"],
                page=row["left_page"],
                x=row["left_x"],
                y=row["left_y"],
                fileName=row["left_file_name"],
                fileHash=row["left_file_hash"],
            ),
            right=AuditPoint(
                side=row["right_side"],
                page=row["right_page"],
                x=row["right_x"],
                y=row["right_y"],
                fileName=row["right_file_name"],
                fileHash=row["right_file_hash"],
            ),
            createdBy=row["created_by"],
            comment=row["comment"],
        )
        for row in rows
    ]
    _log_audit_event(request, "audit_links.list", "success", f"version={version_id} count={len(result)}")
    return result


@app.post("/api/audit-links/{version_id}", response_model=List[AuditLink])
async def save_audit_links(version_id: str, links: List[AuditLink], request: Request):
    role = _require_permission(request, "audit.link")
    _require_client_scope(request, role)
    with _get_db_connection() as conn:
        conn.execute("DELETE FROM audit_links WHERE version_id = ?", (version_id,))
        conn.executemany(
            """
            INSERT INTO audit_links (
                version_id, link_id, created_at,
                left_side, left_page, left_x, left_y, left_file_name, left_file_hash,
                right_side, right_page, right_x, right_y, right_file_name, right_file_hash,
                created_by, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    version_id,
                    link.id,
                    link.createdAt,
                    link.left.side,
                    link.left.page,
                    link.left.x,
                    link.left.y,
                    link.left.fileName,
                    link.left.fileHash,
                    link.right.side,
                    link.right.page,
                    link.right.x,
                    link.right.y,
                    link.right.fileName,
                    link.right.fileHash,
                    link.createdBy,
                    link.comment,
                )
                for link in links
            ],
        )
    _log_audit_event(request, "audit_links.save", "success", f"version={version_id} count={len(links)}")
    return links


class SlotDocumentItem(BaseModel):
    id: str
    client_id: str
    period_key: str
    slot_id: str
    slot_label: Optional[str] = None
    original_name: str
    page_count: Optional[int] = None
    content_sha256: str
    byte_size: int
    uploaded_by: Optional[str] = None
    uploaded_at: str
    logical_document_id: Optional[str] = None
    current_version_id: Optional[str] = None
    current_version_label: Optional[str] = None
    workflow_status: Optional[str] = None
    docugrid_document_id: Optional[str] = None
    logical_status: Optional[str] = None


class DocumentVersionItem(BaseModel):
    id: str
    logical_document_id: str
    version_label: str
    content_sha256: str
    byte_size: int
    page_count: Optional[int] = None
    original_name: str
    source: str
    parent_version_id: Optional[str] = None
    created_by_stakeholder_id: Optional[str] = None
    created_by_email: Optional[str] = None
    created_at: str


def _row_to_slot_item(row: sqlite3.Row) -> SlotDocumentItem:
    return SlotDocumentItem(
        id=row["id"],
        client_id=row["client_id"],
        period_key=row["period_key"],
        slot_id=row["slot_id"],
        slot_label=row["slot_label"],
        original_name=row["original_name"],
        page_count=row["page_count"],
        content_sha256=row["content_sha256"],
        byte_size=row["byte_size"],
        uploaded_by=row["uploaded_by"],
        uploaded_at=row["uploaded_at"],
        logical_document_id=row["logical_document_id"] if "logical_document_id" in row.keys() else None,
        current_version_id=row["current_version_id"] if "current_version_id" in row.keys() else None,
        current_version_label=None,
        workflow_status=None,
        docugrid_document_id=row["docugrid_document_id"] if "docugrid_document_id" in row.keys() else None,
        logical_status=None,
    )


def _latest_workflow_status(client_id: str, period_key: str, slot_id: str) -> Optional[str]:
    _init_review_events_db()
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT status FROM review_events
            WHERE client_id=? AND period_key=? AND slot_id=?
            ORDER BY created_at DESC, rowid DESC
            LIMIT 1
            """,
            (client_id, period_key, slot_id),
        ).fetchone()
    return row["status"] if row else None


def _enrich_slot_item(row: sqlite3.Row) -> SlotDocumentItem:
    item = _row_to_slot_item(row)
    if item.current_version_id:
        version = get_version(item.current_version_id)
        if version:
            item.current_version_label = version.version_label
    item.workflow_status = _latest_workflow_status(row["client_id"], row["period_key"], row["slot_id"])
    logical = get_logical_by_slot(row["client_id"], row["period_key"], row["slot_id"])
    if logical:
        item.logical_status = logical.status
    return item


def _version_to_item(v) -> DocumentVersionItem:
    return DocumentVersionItem(
        id=v.id,
        logical_document_id=v.logical_document_id,
        version_label=v.version_label,
        content_sha256=v.content_sha256,
        byte_size=v.byte_size,
        page_count=v.page_count,
        original_name=v.original_name,
        source=v.source,
        parent_version_id=v.parent_version_id,
        created_by_stakeholder_id=v.created_by_stakeholder_id,
        created_by_email=v.created_by_email,
        created_at=v.created_at,
    )


class ReviewEventCreate(BaseModel):
    client_id: str
    period_key: str
    slot_id: str
    content_sha256: Optional[str] = None
    version_label: Optional[str] = None
    event_type: str
    status: Optional[str] = None
    action_title: Optional[str] = None
    reason: Optional[str] = None
    is_major: bool = False
    logical_document_id: Optional[str] = None
    document_version_id: Optional[str] = None
    detail: Optional[str] = None


class ReviewEventBatchCreate(BaseModel):
    events: List[ReviewEventCreate]


class ReviewEventItem(BaseModel):
    id: str
    client_id: str
    period_key: str
    slot_id: str
    content_sha256: Optional[str] = None
    version_label: Optional[str] = None
    event_type: str
    status: Optional[str] = None
    action_title: Optional[str] = None
    reason: Optional[str] = None
    actor_stakeholder_id: Optional[str] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    is_major: bool = False
    created_at: str
    logical_document_id: Optional[str] = None
    document_version_id: Optional[str] = None
    detail: Optional[str] = None


class ReviewTimelineItem(ReviewEventItem):
    slot_label: Optional[str] = None


def _row_to_review_event(row: sqlite3.Row) -> ReviewEventItem:
    keys = row.keys()
    return ReviewEventItem(
        id=row["id"],
        client_id=row["client_id"],
        period_key=row["period_key"],
        slot_id=row["slot_id"],
        content_sha256=row["content_sha256"],
        version_label=row["version_label"],
        event_type=row["event_type"],
        status=row["status"],
        action_title=row["action_title"],
        reason=row["reason"],
        actor_stakeholder_id=row["actor_stakeholder_id"],
        actor_email=row["actor_email"],
        actor_role=row["actor_role"],
        is_major=bool(row["is_major"]),
        created_at=row["created_at"],
        logical_document_id=row["logical_document_id"] if "logical_document_id" in keys else None,
        document_version_id=row["document_version_id"] if "document_version_id" in keys else None,
        detail=row["detail"] if "detail" in keys else None,
    )


def _append_review_event(
    *,
    client_id: str,
    period_key: str,
    slot_id: str,
    event_type: str,
    content_sha256: Optional[str] = None,
    version_label: Optional[str] = None,
    status: Optional[str] = None,
    action_title: Optional[str] = None,
    reason: Optional[str] = None,
    actor_stakeholder_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    is_major: bool = False,
    logical_document_id: Optional[str] = None,
    document_version_id: Optional[str] = None,
    detail: Optional[str] = None,
) -> ReviewEventItem:
    """追記専用（append-only）の業務監査イベントを記録する。"""
    _init_review_events_db()
    event_id = uuid.uuid4().hex
    now = datetime.utcnow().isoformat()
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute(
            """
            INSERT INTO review_events
                (id, client_id, period_key, slot_id, content_sha256, version_label,
                 event_type, status, action_title, reason,
                 actor_stakeholder_id, actor_email, actor_role, is_major, created_at,
                 logical_document_id, document_version_id, detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                client_id,
                period_key,
                slot_id,
                content_sha256,
                version_label,
                event_type,
                status,
                action_title,
                reason,
                actor_stakeholder_id,
                actor_email,
                actor_role,
                1 if is_major else 0,
                now,
                logical_document_id,
                document_version_id,
                detail,
            ),
        )
        row = conn.execute("SELECT * FROM review_events WHERE id=?", (event_id,)).fetchone()
    return _row_to_review_event(row)


@app.post("/api/slots", response_model=SlotDocumentItem)
async def upsert_slot_document(
    request: Request,
    client_id: str = Form(...),
    period_key: str = Form(...),
    slot_id: str = Form(...),
    slot_label: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    role = _require_permission(request, "document.upload")
    _require_client_access(request, role, client_id)
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        doc = fitz.open("pdf", content)
        page_count = len(doc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF")
    sha = hashlib.sha256(content).hexdigest()
    identity = resolve_identity(request)
    uploaded_by = identity.stakeholder_id or identity.email or ""
    now = datetime.utcnow().isoformat()
    title = slot_label or f"slot-{slot_id}"

    logical = ensure_logical_document(
        client_id=client_id,
        period_key=period_key,
        slot_id=slot_id,
        title=title,
    )
    if logical.current_version_id:
        set_logical_status(logical.id, "processing")
    parent_id = logical.current_version_id
    version = create_document_version(
        logical_id=logical.id,
        content=content,
        original_name=file.filename or "document.pdf",
        content_sha256=sha,
        source="client_upload",
        bump="upload",
        parent_version_id=parent_id,
        created_by_stakeholder_id=identity.stakeholder_id,
        created_by_email=identity.email,
        page_count=page_count,
    )

    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        prev = conn.execute(
            "SELECT id FROM slot_documents WHERE client_id=? AND period_key=? AND slot_id=?",
            (client_id, period_key, slot_id),
        ).fetchone()
        if prev:
            doc_id = prev["id"]
            conn.execute(
                """
                UPDATE slot_documents SET
                    slot_label=?, original_name=?, storage_key=?,
                    page_count=?, content_sha256=?, byte_size=?, uploaded_by=?, uploaded_at=?,
                    logical_document_id=?, current_version_id=?
                WHERE id=?
                """,
                (
                    slot_label,
                    file.filename or "document.pdf",
                    version.storage_key,
                    page_count,
                    sha,
                    len(content),
                    uploaded_by,
                    now,
                    logical.id,
                    version.id,
                    doc_id,
                ),
            )
        else:
            doc_id = uuid.uuid4().hex
            conn.execute(
                """
                INSERT INTO slot_documents
                    (id, client_id, period_key, slot_id, slot_label, original_name, storage_key,
                     page_count, content_sha256, byte_size, uploaded_by, uploaded_at,
                     logical_document_id, current_version_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc_id,
                    client_id,
                    period_key,
                    slot_id,
                    slot_label,
                    file.filename or "document.pdf",
                    version.storage_key,
                    page_count,
                    sha,
                    len(content),
                    uploaded_by,
                    now,
                    logical.id,
                    version.id,
                ),
            )
        row = conn.execute("SELECT * FROM slot_documents WHERE id=?", (doc_id,)).fetchone()
    item = _enrich_slot_item(row)
    _log_audit_event(
        request,
        "slot.upload",
        "success",
        f"client={client_id} period={period_key} slot={slot_id} ver={version.version_label}",
    )
    _append_review_event(
        client_id=client_id,
        period_key=period_key,
        slot_id=slot_id,
        event_type="upload",
        content_sha256=sha,
        version_label=version.version_label,
        status="draft",
        action_title=f"アップロード: {file.filename or 'document.pdf'}",
        actor_stakeholder_id=identity.stakeholder_id or None,
        actor_email=identity.email or None,
        actor_role=role,
        is_major=version.version_label == "v1.0.0",
        logical_document_id=logical.id,
        document_version_id=version.id,
    )
    return item


@app.get("/api/slots", response_model=List[SlotDocumentItem])
async def list_slot_documents(
    request: Request,
    client_id: str = Query(...),
    period_key: Optional[str] = Query(None),
):
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, client_id)
    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        if period_key:
            rows = conn.execute(
                "SELECT * FROM slot_documents WHERE client_id=? AND period_key=? ORDER BY slot_id",
                (client_id, period_key),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM slot_documents WHERE client_id=? ORDER BY period_key, slot_id",
                (client_id,),
            ).fetchall()
    return [_enrich_slot_item(r) for r in rows]


@app.get("/api/slots/{doc_id}/file")
async def get_slot_document_file(request: Request, doc_id: str):
    role = _require_permission(request, "document.view")
    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM slot_documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    _require_client_access(request, role, row["client_id"])
    path = STORAGE_DIR / row["storage_key"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    _log_audit_event(request, "slot.download", "success", f"id={doc_id} client={row['client_id']}")
    return FileResponse(str(path), media_type="application/pdf", filename=row["original_name"])


@app.delete("/api/slots/{doc_id}")
async def delete_slot_document(request: Request, doc_id: str):
    role = _require_permission(request, "document.upload")
    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM slot_documents WHERE id=?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        _require_client_access(request, role, row["client_id"])
        # immutable 版ファイル（versions/）は削除しない
        if not str(row["storage_key"]).startswith("versions/"):
            path = STORAGE_DIR / row["storage_key"]
            try:
                if path.exists():
                    path.unlink()
            except OSError:
                pass
        conn.execute("DELETE FROM slot_documents WHERE id=?", (doc_id,))
    _log_audit_event(request, "slot.delete", "success", f"id={doc_id} client={row['client_id']}")
    return {"ok": True}


def _update_slot_current_version(
    *,
    client_id: str,
    period_key: str,
    slot_id: str,
    version,
    slot_label: Optional[str],
    uploaded_by: str,
) -> None:
    """slot_documents の current ポインタを最新版に更新する。"""
    _init_slot_documents_db()
    now = datetime.utcnow().isoformat()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        prev = conn.execute(
            "SELECT id FROM slot_documents WHERE client_id=? AND period_key=? AND slot_id=?",
            (client_id, period_key, slot_id),
        ).fetchone()
        if prev:
            conn.execute(
                """
                UPDATE slot_documents SET
                    slot_label=COALESCE(?, slot_label), original_name=?, storage_key=?,
                    page_count=?, content_sha256=?, byte_size=?, uploaded_by=?, uploaded_at=?,
                    logical_document_id=?, current_version_id=?
                WHERE id=?
                """,
                (
                    slot_label,
                    version.original_name,
                    version.storage_key,
                    version.page_count,
                    version.content_sha256,
                    version.byte_size,
                    uploaded_by,
                    now,
                    version.logical_document_id,
                    version.id,
                    prev["id"],
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO slot_documents
                    (id, client_id, period_key, slot_id, slot_label, original_name, storage_key,
                     page_count, content_sha256, byte_size, uploaded_by, uploaded_at,
                     logical_document_id, current_version_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    uuid.uuid4().hex,
                    client_id,
                    period_key,
                    slot_id,
                    slot_label,
                    version.original_name,
                    version.storage_key,
                    version.page_count,
                    version.content_sha256,
                    version.byte_size,
                    uploaded_by,
                    now,
                    version.logical_document_id,
                    version.id,
                ),
            )


@app.get("/api/logical-documents/versions", response_model=List[DocumentVersionItem])
async def list_logical_document_versions(
    request: Request,
    client_id: str = Query(...),
    period_key: str = Query(...),
    slot_id: str = Query(...),
):
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, client_id)
    logical = get_logical_by_slot(client_id, period_key, slot_id)
    if not logical:
        return []
    return [_version_to_item(v) for v in list_versions(logical.id)]


@app.get("/api/document-versions/{version_id}/file")
async def get_document_version_file(request: Request, version_id: str):
    role = _require_permission(request, "document.view")
    version = get_version(version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    init_document_versions_db()
    from services.document_version_service import VERSIONS_DB_PATH

    with sqlite3.connect(VERSIONS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        lrow = conn.execute(
            "SELECT client_id FROM logical_documents WHERE id=?",
            (version.logical_document_id,),
        ).fetchone()
    if not lrow:
        raise HTTPException(status_code=404, detail="Logical document not found")
    _require_client_access(request, role, lrow["client_id"])
    path = version_file_path(version)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    _log_audit_event(request, "version.download", "success", f"version={version_id}")
    return FileResponse(str(path), media_type="application/pdf", filename=version.original_name)


@app.post("/api/document-versions", response_model=DocumentVersionItem)
async def post_document_version(
    request: Request,
    client_id: str = Form(...),
    period_key: str = Form(...),
    slot_id: str = Form(...),
    slot_label: Optional[str] = Form(None),
    bump: str = Form("minor"),
    file: UploadFile = File(...),
):
    """編集・監査・承認時の immutable 新版スナップショットを作成する。"""
    role = _require_permission(request, "document.upload")
    _require_client_access(request, role, client_id)
    if bump not in ("minor", "major", "audit_start"):
        raise HTTPException(status_code=400, detail="bump must be minor, major, or audit_start")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        page_count = len(fitz.open("pdf", content))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF")
    sha = hashlib.sha256(content).hexdigest()
    identity = resolve_identity(request)
    uploaded_by = identity.stakeholder_id or identity.email or ""
    title = slot_label or f"slot-{slot_id}"
    logical = ensure_logical_document(
        client_id=client_id,
        period_key=period_key,
        slot_id=slot_id,
        title=title,
    )
    source_map = {
        "minor": "annotation_export",
        "major": "firm_upload",
        "audit_start": "firm_upload",
    }
    version = create_document_version(
        logical_id=logical.id,
        content=content,
        original_name=file.filename or "document.pdf",
        content_sha256=sha,
        source=source_map.get(bump, "annotation_export"),
        bump=bump,  # type: ignore[arg-type]
        parent_version_id=logical.current_version_id,
        created_by_stakeholder_id=identity.stakeholder_id,
        created_by_email=identity.email,
        page_count=page_count,
    )
    if bump == "major":
        mark_approved(logical.id, version.id)
    _update_slot_current_version(
        client_id=client_id,
        period_key=period_key,
        slot_id=slot_id,
        version=version,
        slot_label=slot_label,
        uploaded_by=uploaded_by,
    )
    _log_audit_event(
        request,
        "version.create",
        "success",
        f"client={client_id} slot={slot_id} ver={version.version_label} bump={bump}",
    )
    return _version_to_item(version)


@app.post("/api/review-events", response_model=ReviewEventItem)
async def create_review_event(request: Request, payload: ReviewEventCreate):
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, payload.client_id)
    # 差戻しは理由必須（監査要件）
    if payload.event_type == "remand" and not (payload.reason and payload.reason.strip()):
        raise HTTPException(status_code=400, detail="remand requires a reason")
    identity = resolve_identity(request)
    item = _append_review_event(
        client_id=payload.client_id,
        period_key=payload.period_key,
        slot_id=payload.slot_id,
        event_type=payload.event_type,
        content_sha256=payload.content_sha256,
        version_label=payload.version_label,
        status=payload.status,
        action_title=payload.action_title,
        reason=payload.reason,
        actor_stakeholder_id=identity.stakeholder_id or None,
        actor_email=identity.email or None,
        actor_role=role,
        is_major=payload.is_major,
        logical_document_id=payload.logical_document_id,
        document_version_id=payload.document_version_id,
        detail=payload.detail,
    )
    if payload.logical_document_id:
        if payload.event_type == "approve" and payload.document_version_id:
            mark_approved(payload.logical_document_id, payload.document_version_id)
        elif payload.event_type == "remand":
            mark_remanded(payload.logical_document_id)
    _log_audit_event(
        request,
        "review_event.create",
        "success",
        f"client={payload.client_id} slot={payload.slot_id} type={payload.event_type}",
    )
    return item


@app.get("/api/review-events", response_model=List[ReviewEventItem])
async def list_review_events(
    request: Request,
    client_id: str = Query(...),
    period_key: Optional[str] = Query(None),
    slot_id: Optional[str] = Query(None),
):
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, client_id)
    _init_review_events_db()
    clauses = ["client_id = ?"]
    params: list[str] = [client_id]
    if period_key:
        clauses.append("period_key = ?")
        params.append(period_key)
    if slot_id is not None:
        clauses.append("slot_id = ?")
        params.append(slot_id)
    where = " AND ".join(clauses)
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            f"SELECT * FROM review_events WHERE {where} ORDER BY created_at DESC, rowid DESC",
            params,
        ).fetchall()
    return [_row_to_review_event(r) for r in rows]


def _query_review_events(
    client_id: str,
    period_key: Optional[str] = None,
    slot_id: Optional[str] = None,
) -> List[sqlite3.Row]:
    _init_review_events_db()
    clauses = ["client_id = ?"]
    params: list[str] = [client_id]
    if period_key:
        clauses.append("period_key = ?")
        params.append(period_key)
    if slot_id is not None:
        clauses.append("slot_id = ?")
        params.append(slot_id)
    where = " AND ".join(clauses)
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        return conn.execute(
            f"SELECT * FROM review_events WHERE {where} ORDER BY created_at ASC, rowid ASC",
            params,
        ).fetchall()


def _lookup_slot_label(client_id: str, period_key: str, slot_id: str) -> Optional[str]:
    _init_slot_documents_db()
    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT slot_label FROM slot_documents
            WHERE client_id=? AND period_key=? AND slot_id=?
            """,
            (client_id, period_key, slot_id),
        ).fetchone()
    return row["slot_label"] if row else None


def _query_review_timeline(
    client_id: str,
    period_key: Optional[str] = None,
    limit: int = 50,
) -> List[sqlite3.Row]:
    _init_review_events_db()
    clauses = ["client_id = ?"]
    params: list[str | int] = [client_id]
    if period_key:
        clauses.append("period_key = ?")
        params.append(period_key)
    where = " AND ".join(clauses)
    params.append(limit)
    with sqlite3.connect(REVIEW_EVENTS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        return conn.execute(
            f"SELECT * FROM review_events WHERE {where} ORDER BY created_at DESC, rowid DESC LIMIT ?",
            params,
        ).fetchall()


@app.post("/api/review-events/batch", response_model=List[ReviewEventItem])
async def create_review_events_batch(request: Request, payload: ReviewEventBatchCreate):
    role = _require_permission(request, "document.view")
    if not payload.events:
        raise HTTPException(status_code=400, detail="events must not be empty")
    if len(payload.events) > 100:
        raise HTTPException(status_code=400, detail="too many events (max 100)")
    client_ids = {e.client_id for e in payload.events}
    if len(client_ids) != 1:
        raise HTTPException(status_code=400, detail="all events must share client_id")
    client_id = next(iter(client_ids))
    _require_client_access(request, role, client_id)
    identity = resolve_identity(request)
    items: List[ReviewEventItem] = []
    for event in payload.events:
        if event.client_id != client_id:
            raise HTTPException(status_code=400, detail="client_id mismatch in batch")
        if event.event_type == "remand" and not (event.reason and event.reason.strip()):
            raise HTTPException(status_code=400, detail="remand requires a reason")
        item = _append_review_event(
            client_id=event.client_id,
            period_key=event.period_key,
            slot_id=event.slot_id,
            event_type=event.event_type,
            content_sha256=event.content_sha256,
            version_label=event.version_label,
            status=event.status,
            action_title=event.action_title,
            reason=event.reason,
            actor_stakeholder_id=identity.stakeholder_id or None,
            actor_email=identity.email or None,
            actor_role=role,
            is_major=event.is_major,
            logical_document_id=event.logical_document_id,
            document_version_id=event.document_version_id,
            detail=event.detail,
        )
        items.append(item)
    _log_audit_event(
        request,
        "review_event.batch",
        "success",
        f"client={client_id} count={len(items)}",
    )
    return items


@app.get("/api/review-events/timeline", response_model=List[ReviewTimelineItem])
async def get_review_timeline(
    request: Request,
    client_id: str = Query(...),
    period_key: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """顧問先（＋任意で期間）横断の監査イベントを新しい順に返す。"""
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, client_id)
    rows = _query_review_timeline(client_id, period_key, limit)
    label_cache: dict[tuple[str, str, str], Optional[str]] = {}
    items: List[ReviewTimelineItem] = []
    for row in rows:
        base = _row_to_review_event(row)
        cache_key = (row["client_id"], row["period_key"], row["slot_id"])
        if cache_key not in label_cache:
            label_cache[cache_key] = _lookup_slot_label(*cache_key)
        items.append(
            ReviewTimelineItem(
                **base.model_dump(),
                slot_label=label_cache[cache_key],
            )
        )
    _log_audit_event(
        request,
        "review_event.timeline",
        "success",
        f"client={client_id} period={period_key or 'all'} count={len(items)}",
    )
    return items


@app.get("/api/review-events/export")
async def export_review_events(
    request: Request,
    client_id: str = Query(...),
    period_key: Optional[str] = Query(None),
    slot_id: Optional[str] = Query(None),
    format: str = Query("csv", pattern="^(csv|json)$"),
):
    role = _require_permission(request, "audit.approve")
    _require_client_access(request, role, client_id)
    rows = _query_review_events(client_id, period_key, slot_id)
    items = [_row_to_review_event(r) for r in rows]
    stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    base_name = f"review-events_{client_id}_{period_key or 'all'}_{stamp}"

    if format == "json":
        payload = json.dumps([i.model_dump() for i in items], ensure_ascii=False, indent=2)
        return Response(
            content=payload,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.json"'},
        )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "created_at",
            "event_type",
            "status",
            "action_title",
            "version_label",
            "client_id",
            "period_key",
            "slot_id",
            "actor_email",
            "actor_role",
            "reason",
            "detail",
            "document_version_id",
            "logical_document_id",
        ]
    )
    for item in items:
        writer.writerow(
            [
                item.created_at,
                item.event_type,
                item.status or "",
                item.action_title or "",
                item.version_label or "",
                item.client_id,
                item.period_key,
                item.slot_id,
                item.actor_email or "",
                item.actor_role or "",
                item.reason or "",
                item.detail or "",
                item.document_version_id or "",
                item.logical_document_id or "",
            ]
        )
    return Response(
        content="\ufeff" + buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{base_name}.csv"'},
    )


@app.post("/api/classify")
async def classify_document(
    request: Request,
    file: UploadFile = File(...),
    candidates: str = Form(...),
    client_id: Optional[str] = Form(None),
    period_key: Optional[str] = Form(None),
    slot_id: Optional[str] = Form(None),
):
    """OCR/テキスト抽出＋ルールベース分類で、候補スロットの推定を返す（自動振り分け v1）。"""
    role = _require_permission(request, "document.upload")
    if client_id:
        _require_client_access(request, role, client_id)
    else:
        _require_client_scope(request, role)

    try:
        parsed = json.loads(candidates)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="candidates must be valid JSON")
    if not isinstance(parsed, list) or not parsed:
        raise HTTPException(status_code=400, detail="candidates must be a non-empty list")
    norm_candidates = [
        {"id": str(c.get("id", c.get("label", ""))), "label": str(c.get("label", ""))}
        for c in parsed
        if isinstance(c, dict) and c.get("label")
    ]
    if not norm_candidates:
        raise HTTPException(status_code=400, detail="candidates require label")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    logical_for_classify = None
    if client_id and period_key and slot_id:
        logical_for_classify = get_logical_by_slot(client_id, period_key, slot_id)
        if logical_for_classify:
            set_logical_status(logical_for_classify.id, "processing")

    try:
        result = classify_pdf(content, file.filename, norm_candidates)
        cfg = _load_system_config()
        excerpt = str(result.get("text_excerpt") or "")
        conf = float(result.get("confidence") or 0)
        if cfg.ocr_auto_extract_enabled and conf < 0.6:
            if cfg.ai_openai_enabled:
                api_key = get_openai_key()
                if api_key:
                    boost = ai_classify_boost(
                        excerpt,
                        file.filename,
                        norm_candidates,
                        api_key,
                        cfg.ai_openai_model,
                    )
                    if boost and float(boost.get("confidence") or 0) > conf:
                        result["best"] = boost["best"]
                        result["confidence"] = boost["confidence"]
                        result["engine"] = "openai"
                        result["ai_reason"] = boost.get("reason")
                        conf = float(boost["confidence"])
            if conf < 0.6 and cfg.ai_gemini_enabled:
                gemini_key = get_gemini_key()
                if gemini_key:
                    boost = gemini_classify_boost(
                        excerpt,
                        file.filename,
                        norm_candidates,
                        gemini_key,
                        cfg.ai_gemini_model,
                    )
                    if boost and float(boost.get("confidence") or 0) > conf:
                        result["best"] = boost["best"]
                        result["confidence"] = boost["confidence"]
                        result["engine"] = "gemini"
                        result["ai_reason"] = boost.get("reason")
        best = result.get("best") or {}
        _log_audit_event(
            request,
            "document.classify",
            "success",
            f"engine={result.get('engine')} best={best.get('label')} conf={result.get('confidence')}",
        )
        return result
    finally:
        if logical_for_classify and logical_for_classify.current_version_id:
            set_logical_status(logical_for_classify.id, "uploaded")


@app.get("/api/document-status")
async def get_document_status(
    request: Request,
    client_id: str = Query(...),
    period_key: Optional[str] = Query(None),
):
    """必要書類マスタと保存済み資料を突き合わせ、不足状況を返す（不足資料エンジン v1）。

    - period_key 指定: その期間の単一ステータス（未アップロードでも必須一覧から不足を算出）。
    - 未指定: アップロード実績のある全期間のサマリ + 合計不足点数。
    """
    role = _require_permission(request, "document.view")
    _require_client_access(request, role, client_id)
    _init_slot_documents_db()
    logical_status = slot_status_map(client_id, period_key)

    def approved_slots(pk: str) -> set[str]:
        return {sid for sid, st in logical_status.get(pk, {}).items() if st == "approved"}

    with sqlite3.connect(SLOT_DOCS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        if period_key:
            rows = conn.execute(
                "SELECT slot_id FROM slot_documents WHERE client_id=? AND period_key=?",
                (client_id, period_key),
            ).fetchall()
            filled = {str(r["slot_id"]) for r in rows}
            return compute_period_status(period_key, filled, approved_slots(period_key))
        rows = conn.execute(
            "SELECT period_key, slot_id FROM slot_documents WHERE client_id=?",
            (client_id,),
        ).fetchall()

    by_period: Dict[str, set] = {}
    for r in rows:
        by_period.setdefault(r["period_key"], set()).add(str(r["slot_id"]))

    periods = [
        compute_period_status(pk, ids, approved_slots(pk))
        for pk, ids in by_period.items()
    ]
    periods.sort(key=lambda p: p["period_key"])
    missing_total = sum(len(p["missing"]) for p in periods)
    pending_approval_total = sum(len(p.get("pending_approval") or []) for p in periods)
    incomplete = [p for p in periods if not p["complete"]]
    return {
        "client_id": client_id,
        "periods": periods,
        "missing_total": missing_total,
        "pending_approval_total": pending_approval_total,
        "incomplete_count": len(incomplete),
        "started_count": len(periods),
    }


@app.on_event("startup")
async def on_startup() -> None:
    for warning in validate_auth_config():
        logging.getLogger("docugrid.auth").warning(warning)
    _init_audit_links_db()
    _init_audit_events_db()
    _init_slot_documents_db()
    _init_review_events_db()
    init_document_versions_db()

# --- 1. PDF情報取得 ---
@app.post("/api/pdf/info")
async def get_pdf_info(request: Request, file: UploadFile = File(...)):
    role = _require_permission(request, "document.upload")
    _require_client_scope(request, role)
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        _log_audit_event(request, "pdf.info", "success", f"pages={len(doc)}")
        return {"page_count": len(doc), "pageCount": len(doc)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 2. 編集・描画 (大幅強化) ---
@app.post("/api/highlight")
async def highlight_pdf(
    request: Request,
    file: UploadFile = File(...),
    page: int = Form(...),
    # 0.0〜1.0の正規化座標 (画面上の比率) で受け取る
    x: float = Form(...),
    y: float = Form(...),
    w: float = Form(...),
    h: float = Form(...),
    type: str = Form("marker"),  # marker, box, line, check, eraser
    # marker / eraser のフリーハンド: [{ "x": 0..1, "y": 0..1 }, ...] の JSON 配列
    path_json: Optional[str] = Form(None),
    # "1" / "true" のとき PDF に加えレンダー PNG を JSON で返し、クライアントの2往復を1回にまとめる
    include_render: Optional[str] = Form(None),
):
    role = _require_permission(request, "document.annotate")
    _require_client_scope(request, role)
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        
        if 0 <= page < len(doc):
            p = doc[page]
            page_w = p.rect.width
            page_h = p.rect.height
            
            # 比率を実際のPDF座標に変換
            abs_x = x * page_w
            abs_y = y * page_h
            abs_w = w * page_w
            abs_h = h * page_h
            
            rect = fitz.Rect(abs_x, abs_y, abs_x + abs_w, abs_y + abs_h)
            stroke_path = parse_norm_path_json(path_json)

            if type == "box":
                p.draw_rect(rect, color=(1, 0, 0), width=3)
            elif type == "marker":
                if stroke_path:
                    draw_freehand_marker(p, stroke_path)
                else:
                    annot = p.add_highlight_annot(rect)
                    annot.set_colors(stroke=(1, 1, 0))
                    annot.update()
            elif type == "line":
                # 左上から右下へ線を引く
                p.draw_line((abs_x, abs_y), (abs_x + abs_w, abs_y + abs_h), color=(0, 0, 1), width=3)
            elif type == "check":
                # チェックマークを描画 (2本の線で構成)
                p.draw_line(
                    (abs_x, abs_y + abs_h * 0.6),
                    (abs_x + abs_w * 0.4, abs_y + abs_h),
                    color=(0, 0.8, 0),
                    width=4,
                )
                p.draw_line(
                    (abs_x + abs_w * 0.4, abs_y + abs_h),
                    (abs_x + abs_w, abs_y),
                    color=(0, 0.8, 0),
                    width=4,
                )
            elif type == "eraser":
                erase_rect = path_bbox_rect(p, stroke_path) if stroke_path else rect
                delete_annots_intersecting(p, erase_rect)
                if stroke_path:
                    draw_freehand_eraser(p, stroke_path)
                else:
                    p.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)

        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        output_buffer.seek(0)
        pdf_bytes = output_buffer.getvalue()
        _log_audit_event(request, "pdf.highlight", "success", f"page={page} type={type}")

        want_render = include_render and str(include_render).lower() in ("1", "true", "yes", "on")
        if want_render:
            preview_b64 = ""
            doc_r = None
            try:
                doc_r = fitz.open(stream=pdf_bytes, filetype="pdf")
                if 0 <= page < len(doc_r):
                    pr = doc_r[page]
                    pix = pr.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
                    preview_b64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
            except Exception as render_err:
                print(f"Highlight include_render preview: {render_err}")
            finally:
                if doc_r is not None:
                    doc_r.close()
            return JSONResponse(
                content={
                    "pdf_base64": base64.b64encode(pdf_bytes).decode("utf-8"),
                    "preview_png_base64": preview_b64,
                }
            )

        return Response(content=pdf_bytes, media_type="application/pdf")

    except Exception as e:
        print(f"Highlight Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 3. ページ並べ替え ---
@app.post("/api/edit/reorder")
async def reorder_pdf(
    request: Request,
    file: UploadFile = File(...),
    order: str = Form(...)
):
    role = _require_permission(request, "document.annotate")
    _require_client_scope(request, role)
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        try:
            page_indices = [int(x.strip()) for x in order.split(",") if x.strip()]
        except ValueError:
            return JSONResponse(status_code=400, content={"message": "Invalid order format"})

        max_page = len(doc) - 1
        valid_indices = [idx for idx in page_indices if 0 <= idx <= max_page]
        if not valid_indices:
            return JSONResponse(status_code=400, content={"message": "No valid pages to reorder"})

        doc.select(valid_indices)
        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        output_buffer.seek(0)
        _log_audit_event(request, "pdf.reorder", "success", f"order={order}")
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 4. サムネイル取得 ---
@app.post("/api/pdf/thumbnails")
async def get_pdf_thumbnails(request: Request, file: UploadFile = File(...)):
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        thumbnails = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3)) 
            img_data = pix.tobytes("png")
            b64_str = base64.b64encode(img_data).decode("utf-8")
            thumbnails.append(f"data:image/png;base64,{b64_str}")
        _log_audit_event(request, "pdf.thumbnails", "success", f"count={len(thumbnails)}")
        return JSONResponse(content={"thumbnails": thumbnails})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 5. PDF結合（OrderPayload + ファイル ID 対応） ---
@app.post("/api/edit/merge-ordered")
async def merge_pdfs_ordered(
    request: Request,
    order: str = Form(..., description="JSON string of OrderPayload (camelCase)"),
    file_ids: str = Form(..., description='JSON array of file ids, same order as "files" parts'),
    files: List[UploadFile] = File(...),
):
    """
    multipart/form-data:
    - `order`: OrderPayload の JSON 文字列（version, orderedPages, highlightsByPage など）
    - `file_ids`: `["file-uuid-1","file-uuid-2"]` 形式（`files` と同じ長さ・順序）
    - `files`: 各 file_id に対応する PDF バイナリ（フィールド名はすべて `files`）
    """
    role = _require_permission(request, "document.upload")
    _require_client_scope(request, role)
    try:
        payload = OrderPayload.model_validate_json(order)
        ids = json.loads(file_ids)
        if not isinstance(ids, list) or not all(isinstance(x, str) for x in ids):
            raise HTTPException(status_code=400, detail="file_ids must be a JSON array of strings")
        if len(ids) != len(files):
            raise HTTPException(status_code=400, detail="file_ids and files length mismatch")
        file_bytes_by_id: dict[str, bytes] = {}
        for fid, uf in zip(ids, files):
            file_bytes_by_id[fid] = await uf.read()
        merged_bytes = merge_pdf_bytes_from_order_payload(file_bytes_by_id, payload)
        hl = payload.highlights_by_page
        hl_note = f" highlight_batches={len(hl)}" if hl else ""
        _log_audit_event(
            request,
            "pdf.merge_ordered",
            "success",
            f"ordered_pages={len(payload.ordered_pages)}{hl_note}",
        )
        return Response(content=merged_bytes, media_type="application/pdf")
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})


@app.post("/api/edit/merge")
async def merge_pdfs(request: Request, files: List[UploadFile] = File(...)):
    role = _require_permission(request, "document.upload")
    _require_client_scope(request, role)
    try:
        merged_doc = fitz.open()
        for file in files:
            content = await file.read()
            doc = fitz.open("pdf", content)
            merged_doc.insert_pdf(doc)
        output_buffer = io.BytesIO()
        merged_doc.save(output_buffer)
        output_buffer.seek(0)
        _log_audit_event(request, "pdf.merge", "success", f"files={len(files)}")
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 6. ページ画像レンダリング (NEW!) ---
# 編集用に高画質(matrix=2.0)で1ページだけ取得する
@app.post("/api/pdf/render")
async def render_pdf_page(
    request: Request,
    file: UploadFile = File(...),
    page: int = Form(...)
):
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        if 0 <= page < len(doc):
            p = doc[page]
            pix = p.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img_data = pix.tobytes("png")
            _log_audit_event(request, "pdf.render", "success", f"page={page}")
            return Response(content=img_data, media_type="image/png")
        else:
            return JSONResponse(status_code=400, content={"message": "Page out of range"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})


# --- DocuGrid ワークスペース永続化 ---
@app.post("/api/docugrid/save")
async def docugrid_save(request: Request, body: DocugridSaveRequest):
    role = _require_permission(request, "document.annotate")
    _require_client_scope(request, role)
    if body.client_id:
        _require_client_access(request, role, body.client_id)
    try:
        out = save_workspace(body)
        doc_id = out.get("documentId")
        if doc_id and body.client_id and body.period_key and body.slot_id:
            _link_docugrid_to_slot(body.client_id, body.period_key, body.slot_id, str(doc_id))
        _log_audit_event(
            request,
            "docugrid.save",
            "success",
            f"documentId={doc_id} client={body.client_id} slot={body.slot_id}",
        )
        return out
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})


@app.get("/api/docugrid/load/{document_id}")
async def docugrid_load(request: Request, document_id: str):
    role = _require_permission(request, "document.view")
    _require_client_scope(request, role)
    try:
        data = load_workspace(document_id)
        _log_audit_event(request, "docugrid.load", "success", f"documentId={document_id}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})
