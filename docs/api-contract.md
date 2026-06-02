# Docugrid API Contract (Current Runtime)

## Scope

This contract defines the API surface for the current Docugrid runtime:

- Backend: `backend/main.py`
- Base URL (local default): `http://127.0.0.1:8000`

All write/edit endpoints use `multipart/form-data`.

## Conventions

- **Success (JSON)**: endpoint-specific JSON payload.
- **Success (binary)**: `application/pdf` or `image/png`.
- **Error**: currently returned as JSON:
  - `{ "message": "..." }` for most handled errors
  - FastAPI default `{ "detail": "..." }` for `HTTPException` paths

For frontend handling, treat both `message` and `detail` as possible error fields.

## Endpoints

## `GET /files`

Returns available PDF files from backend `storage/`.

- Response `200` (`application/json`):

```json
[
  {
    "id": "sample",
    "name": "sample.pdf",
    "updated_at": "2026-04-16T14:23:11.120000",
    "url": "http://127.0.0.1:8000/files/sample.pdf"
  }
]
```

## `GET /files/{filename}`

Downloads/streams a PDF from storage.

- Path param:
  - `filename`: URL-encoded PDF file name.
- Response:
  - `200` with `application/pdf`
  - `404` if not found
  - `400` if invalid path

## `POST /api/pdf/info`

Returns page count for one uploaded PDF.

- Form fields:
  - `file` (required): PDF file.
- Response `200`:

```json
{
  "page_count": 12,
  "pageCount": 12
}
```

Notes:
- Both keys currently exist for compatibility.

## `POST /api/highlight`

Applies annotation/drawing on one page and returns updated PDF.

- Form fields:
  - `file` (required): PDF file
  - `page` (required, integer): 0-based page index
  - `x` (required, float): normalized [0..1] x
  - `y` (required, float): normalized [0..1] y
  - `w` (required, float): normalized [0..1] width
  - `h` (required, float): normalized [0..1] height
  - `type` (optional): `marker` | `box` | `line` | `check` | `eraser` (default: `marker`)
  - `path_json` (optional): JSON array of `{ "x", "y" }` in 0..1 — freehand stroke for `marker` / `eraser` (when omitted, `marker` uses rect highlight as before)
- Response:
  - `200` with `application/pdf`
  - `500` with `{ "message": "..." }`

## `POST /api/edit/reorder`

Reorders/selects pages and returns updated PDF.

- Form fields:
  - `file` (required): PDF file
  - `order` (required, string): comma-separated 0-based page indices
    - example: `"2,0,1"`
- Response:
  - `200` with `application/pdf`
  - `400` with `{ "message": "Invalid order format" }` or `{ "message": "No valid pages to reorder" }`
  - `500` with `{ "message": "..." }`

## `POST /api/pdf/thumbnails`

Returns page thumbnails as data URLs.

- Form fields:
  - `file` (required): PDF file
- Response `200`:

```json
{
  "thumbnails": [
    "data:image/png;base64,iVBORw0KGgoAAA..."
  ]
}
```

## `POST /api/edit/merge`

Merges multiple uploaded PDFs in submitted order.

- Form fields:
  - `files` (required, repeated): two or more PDF files
- Response:
  - `200` with `application/pdf`
  - `500` with `{ "message": "..." }`

## `POST /api/pdf/render`

Renders one page as PNG image.

- Form fields:
  - `file` (required): PDF file
  - `page` (required, integer): 0-based page index
- Response:
  - `200` with `image/png`
  - `400` with `{ "message": "Page out of range" }`
  - `500` with `{ "message": "..." }`

## `GET /api/audit-links/{version_id}`

Returns persisted audit link pairs for a specific version.

- Path param:
  - `version_id` (required): version identifier (`versionId` on frontend)
- Response `200` (`application/json`):

```json
[
  {
    "id": "3b3f6a4c-8fd0-4f66-bec8-12de2f3d7ed8",
    "createdAt": "2026-04-17T00:12:05.155Z",
    "createdBy": "demo-user",
    "left": {
      "side": "left",
      "page": 0,
      "x": 0.42,
      "y": 0.33,
      "fileName": "left.pdf",
      "fileHash": "sha256-hex"
    },
    "right": {
      "side": "right",
      "page": 1,
      "x": 0.61,
      "y": 0.45,
      "fileName": "right.pdf",
      "fileHash": "sha256-hex"
    }
  }
]
```

## `POST /api/audit-links/{version_id}`

Replaces all audit links for the given version with the submitted list.

- Path param:
  - `version_id` (required)
- Request body (`application/json`): array of `AuditLink` objects
- Response `200`: saved array (same schema as GET)

Persistence note:
- Stored in SQLite at `storage/audit_links.db` on backend.

## `POST /api/auth/login`

- Request JSON: `email`, `password`, `stakeholder_id`.
- Response includes `access_token`, `token_type` (`bearer`), and `expires_in` (seconds). Expiry follows environment `DOCUGRID_JWT_EXP_HOURS` (default `24`).

### Auth environment (production)

| Variable | Development default | Production requirement |
|----------|---------------------|------------------------|
| `DOCUGRID_ENV` | `development` | `production` |
| `DOCUGRID_JWT_SECRET` | dev placeholder | **Required**, ≥ 32 chars |
| `DOCUGRID_ALLOW_HEADER_AUTH` | `true` (implicit) | **`false`** |
| `DOCUGRID_LOGIN_PASSWORD` | `password` | **Must change** |

See `backend/.env.example`. Startup calls `validate_auth_config()` and **fails fast** in production when misconfigured.

Frontend sends `Authorization: Bearer …` after login; legacy `X-Docugrid-Role` headers are dev/test fallback only.

## `GET` / `PUT /api/client-master`

- Requires authenticated user with `settings.manage` and valid client scope header for non-admin roles.
- `PUT` rejects duplicate client or group ids and group `clientIds` that reference unknown clients.

## `GET` / `PUT /api/stakeholder-master`

- Requires `settings.manage` and client scope (same as client master).
- Response / request body:
  - `roleByStakeholderId`: map of stakeholder id → app role (`viewer`, `operator`, …).
  - `clientScopesByStakeholderId`: map of stakeholder id → list of client ids.
  - `updated_at`: optional metadata timestamp.
- File overlay: values in `storage/stakeholder_master.json` are merged on top of built-in defaults in code. Saving replaces that file and refreshes the in-memory cache used at login and for scope checks.

## `GET /api/audit-events`

- Query parameters include `limit`, `offset`, `from_ts`, `to_ts`, `client_id`, `stakeholder_id`, `action`, `result` (`success` | `denied`), `path_contains`, and **`http_status`** (exact HTTP status for denial rows, e.g. `401`).

## Slot document persistence

### `POST /api/slots`

Upload or replace a PDF for `client_id` × `period_key` × `slot_id`.

- Form fields: `client_id`, `period_key`, `slot_id`, `slot_label`, `file` (PDF).
- Creates immutable version `v1.0.0` on first upload; re-upload bumps minor (e.g. `v1.1.0`) and keeps prior versions.
- Re-upload sets `logical_status` to `processing` during save, then `uploaded`.
- Response `200` (`SlotDocumentItem`): includes `current_version_label`, `workflow_status`, `logical_status`, `logical_document_id`, etc.

### `GET /api/slots`

- Query: `client_id` (required), `period_key` (optional).
- Lists persisted slot documents with version and workflow metadata.

### `GET /api/slots/{doc_id}/file`

- Returns stored PDF bytes (`application/pdf`).

### `DELETE /api/slots/{doc_id}`

- Removes slot row and storage file (logical versions remain for audit).

## Immutable document versions

### `GET /api/logical-documents/versions`

- Query: `client_id`, `period_key`, `slot_id`.
- Lists all immutable versions for the logical document (newest last).

### `POST /api/document-versions`

- Form: `client_id`, `period_key`, `slot_id`, `slot_label`, `bump` (`minor` | `major` | `audit_start`), `file`.
- `minor`: annotation/work-save snapshot (`source: annotation_export`).
- `audit_start`: check-mode start (`v2.0.0`).
- `major`: approval snapshot; marks logical document approved.

### `GET /api/document-versions/{version_id}/file`

- Downloads immutable PDF for a specific version id.

## Business audit (`review_events`)

Append-only workflow and viewing events. Requires auth + client scope.

### `POST /api/review-events`

- JSON body: `client_id`, `period_key`, `slot_id`, `event_type`, optional `status`, `action_title`, `version_label`, `reason`, `detail`, `logical_document_id`, `document_version_id`, `is_major`.
- `remand` requires non-empty `reason`.
- `approve` with ids updates logical document approval state.

Event types include: `upload`, `work_save`, `audit_start`, `approve`, `remand`, `page_view`, `annotate`, `export_pdf`, `viewer_open_preview`, `viewer_open_edit`, `viewer_close`, `audit_link_create`.

### `GET /api/review-events`

- Query: `client_id`, optional `period_key`, optional `slot_id`.
- Returns events oldest-first (slot history panel).

### `GET /api/review-events/timeline`

- Query: `client_id` (required), optional `period_key`, `limit` (1–200, default 50).
- Returns events **newest-first** with `slot_label` enrichment (MatrixGrid / settings timeline).

### `POST /api/review-events/batch`

- Up to 100 events sharing one `client_id` (used for `page_view` debounce flush).

### `GET /api/review-events/export`

- Query: `client_id`, optional `period_key`, optional `slot_id`, `format` (`csv` | `json`).
- Requires `audit.approve` permission.

## Classification and document status

### `POST /api/classify`

- Form: `file`, `candidates` (JSON array of `{ id, label }`), optional `client_id`, `period_key`, `slot_id`.
- Returns rule-based (+ optional OpenAI/Gemini) slot suggestion with confidence.
- When `period_key` + `slot_id` provided and document exists, sets `logical_status` to `processing` during classify.

### `GET /api/document-status`

- Query: `client_id`, optional `period_key`.
- Returns required-document checklist, missing slots, `pending_approval`, per-period completeness.

## DocuGrid cloud sync

### `POST /api/docugrid/save`

- Persists normalized page order / highlights; optional `clientId`, `periodKey`, `slotId` link to slot row.

### `GET /api/docugrid/load/{document_id}`

- Restores saved DocuGrid workspace JSON.

### `GET` / `PUT /api/stakeholder-master`

- Requires `settings.manage`.
- Body: `roleByStakeholderId`, `clientScopesByStakeholderId` (client ids must exist in client master).
- Persisted to `storage/stakeholder_master.json`; merged at login for scope checks.

## Frontend Integration Notes

Current frontend should assume:

1. API base comes from `NEXT_PUBLIC_API_BASE`.
2. `/files` lives on backend root, not under `/api`.
3. Reorder payload must be comma-separated string, not JSON array string.
4. Binary endpoints require `response.blob()`.
5. Audit link save is full-replace per version (`POST /api/audit-links/{version_id}`).

## Next Contract Hardening (Planned)

1. Standardize all errors to one schema:
   - `{ "error": { "code": "STRING_CODE", "message": "Human readable" } }`
2. Version API under `/api/v1`.
3. Define OpenAPI-derived TypeScript types for request/response reuse.
