import base64
import io
import json
import os
import sqlite3
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import fitz  # PyMuPDF
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from docugrid_auth import (
    JWT_EXP_SECONDS,
    STAKEHOLDER_ROLE_BY_ID,
    create_access_token,
    peek_identity_for_audit,
    resolve_identity,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_LINKS_DB_PATH = STORAGE_DIR / "audit_links.db"
AUDIT_EVENTS_DB_PATH = STORAGE_DIR / "audit_events.db"
SYSTEM_CONFIG_PATH = STORAGE_DIR / "system_config.json"
CLIENT_MASTER_PATH = STORAGE_DIR / "client_master.json"

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

STAKEHOLDER_CLIENT_SCOPES: dict[str, set[str]] = {
    "actor-s1": {"c1", "c2", "c3"},
    "actor-s2": {"c4", "c5"},
    "actor-s3": {"c1", "c2", "c3", "c4", "c5"},
    "actor-c1": {"c1"},
    "actor-b1": {"c1"},
    "actor-tp1": {"c2"},
    "actor-tax1": {"c1", "c2", "c3", "c4", "c5"},
}


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
    allowed = STAKEHOLDER_CLIENT_SCOPES.get(stakeholder_id, set())
    if client_id not in allowed:
        raise HTTPException(status_code=403, detail="Client scope denied")
    return client_id


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
    left: AuditPoint
    right: AuditPoint


class SystemConfigPayload(BaseModel):
    google_drive_connected: bool = False
    notification_email_enabled: bool = True
    ocr_auto_extract_enabled: bool = True
    alert_consumption_tax_months_before_due: int = 2
    alert_corporate_tax_months_before_due: int = 2
    updated_at: str | None = None


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


def _load_system_config() -> SystemConfigPayload:
    if not SYSTEM_CONFIG_PATH.exists():
        return SystemConfigPayload(google_drive_connected=False, updated_at=None)
    try:
        data = json.loads(SYSTEM_CONFIG_PATH.read_text(encoding="utf-8"))
        return SystemConfigPayload(**data)
    except Exception:
        return SystemConfigPayload(google_drive_connected=False, updated_at=None)


def _save_system_config(payload: SystemConfigPayload) -> SystemConfigPayload:
    next_payload = SystemConfigPayload(
        google_drive_connected=payload.google_drive_connected,
        notification_email_enabled=payload.notification_email_enabled,
        ocr_auto_extract_enabled=payload.ocr_auto_extract_enabled,
        alert_consumption_tax_months_before_due=payload.alert_consumption_tax_months_before_due,
        alert_corporate_tax_months_before_due=payload.alert_corporate_tax_months_before_due,
        updated_at=datetime.utcnow().isoformat(),
    )
    SYSTEM_CONFIG_PATH.write_text(next_payload.model_dump_json(indent=2), encoding="utf-8")
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


@app.get("/api/system-config", response_model=SystemConfigPayload)
async def get_system_config(request: Request):
    role = _require_permission(request, "settings.manage")
    payload = _load_system_config()
    _log_audit_event(request, "system_config.get", "success")
    return payload


@app.put("/api/system-config", response_model=SystemConfigPayload)
async def update_system_config(request: Request, payload: SystemConfigPayload):
    role = _require_permission(request, "settings.manage")
    if payload.alert_consumption_tax_months_before_due < 0 or payload.alert_corporate_tax_months_before_due < 0:
        raise HTTPException(status_code=400, detail="Alert months must be non-negative")
    saved = _save_system_config(payload)
    _log_audit_event(
        request,
        "system_config.put",
        "success",
        f"drive={saved.google_drive_connected} notify={saved.notification_email_enabled} ocr={saved.ocr_auto_extract_enabled}",
    )
    return saved


@app.get("/api/client-master", response_model=ClientMasterPayload)
async def get_client_master(request: Request):
    role = _require_permission(request, "settings.manage")
    payload = _load_client_master()
    _log_audit_event(request, "client_master.get", "success", f"clients={len(payload.clients)}")
    return payload


@app.put("/api/client-master", response_model=ClientMasterPayload)
async def update_client_master(request: Request, payload: ClientMasterPayload):
    role = _require_permission(request, "settings.manage")
    saved = _save_client_master(payload)
    _log_audit_event(request, "client_master.put", "success", f"clients={len(saved.clients)} groups={len(saved.groups)}")
    return saved


@app.post("/api/auth/login", response_model=TokenResponse)
async def auth_login(body: LoginRequest, request: Request):
    expected = os.environ.get("DOCUGRID_LOGIN_PASSWORD", "password")
    if body.password != expected:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    temp_admin_email = os.environ.get("DOCUGRID_TEMP_ADMIN_EMAIL", "admin@tax.co.jp").strip().lower()
    requested_email = body.email.strip().lower()

    resolved_stakeholder_id = body.stakeholder_id
    role = STAKEHOLDER_ROLE_BY_ID.get(resolved_stakeholder_id)
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
    return TokenResponse(access_token=token, expires_in=JWT_EXP_SECONDS)


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
):
    role = _require_permission(request, "settings.manage")
    _require_client_scope(request, role)
    _init_audit_events_db()
    clauses: list[str] = ["1=1"]
    params: list[object] = []
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
                created_by
            FROM audit_links
            WHERE version_id = ?
            ORDER BY created_at DESC
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
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                )
                for link in links
            ],
        )
    _log_audit_event(request, "audit_links.save", "success", f"version={version_id} count={len(links)}")
    return links


@app.on_event("startup")
async def on_startup() -> None:
    _init_audit_links_db()
    _init_audit_events_db()

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
    type: str = Form("marker") # marker, box, line, check
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
            
            if type == "box":
                p.draw_rect(rect, color=(1, 0, 0), width=3)
            elif type == "marker":
                annot = p.add_highlight_annot(rect)
                annot.set_colors(stroke=(1, 1, 0))
                annot.update()
            elif type == "line":
                # 左上から右下へ線を引く
                p.draw_line((abs_x, abs_y), (abs_x + abs_w, abs_y + abs_h), color=(0, 0, 1), width=3)
            elif type == "check":
                # チェックマークを描画 (2本の線で構成)
                # 左上(start) -> 中央下(mid) -> 右上(end) のようなV字
                # 簡易的に rect の中にチェックを描く
                center_x = abs_x + abs_w / 2
                bottom_y = abs_y + abs_h
                
                # 線1: 左～下
                p.draw_line((abs_x, abs_y + abs_h * 0.6), (abs_x + abs_w * 0.4, abs_y + abs_h), color=(0, 0.8, 0), width=4)
                # 線2: 下～右
                p.draw_line((abs_x + abs_w * 0.4, abs_y + abs_h), (abs_x + abs_w, abs_y), color=(0, 0.8, 0), width=4)

        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        output_buffer.seek(0)
        _log_audit_event(request, "pdf.highlight", "success", f"page={page} type={type}")
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")

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

# --- 5. PDF結合 ---
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
