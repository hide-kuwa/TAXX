# Docugrid API Contract (Current Runtime)

## Scope

This contract defines the API surface for the current Docugrid runtime:

- Backend: `backend/main.py`
- Base URL (local default): `http://127.0.0.1:3100`

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
    "url": "http://127.0.0.1:3100/files/sample.pdf"
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
  - `type` (optional): `marker` | `box` | `line` | `check` (default: `marker`)
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
