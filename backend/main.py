import io

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import uvicorn

# --- 修正ポイント: 全て 'backend.' をプレフィックスとして追加 ---
from backend.PDF import editor
from backend.services.audit_core import AuditService
from backend.services.drive import DriveService

# Phase 3-2: データベースとルーターの統合
from backend import database
from backend import models
from backend.routers import issues

# データベーステーブルの自動作成（起動時）
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# サービスの初期化
drive_service = DriveService()
audit_service = AuditService()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録 (課題管理API)
app.include_router(issues.router, prefix="/api/issues", tags=["issues"])


@app.get("/")
def read_root():
    return {"status": "TAXX Engine V3.1 Running"}


# --- 1. PDF編集・ハイライト機能 ---
# Phase 1の要件に基づき、highlightを正としつつ、旧エンドポイントも維持
@app.post("/api/highlight")
@app.post("/api/edit/mark")
async def highlight(
    file: UploadFile = File(...),
    page: int = Form(...),
    x: float = Form(...),
    y: float = Form(...),
    width: float = Form(...),
    height: float = Form(...),
):
    try:
        # width, heightは将来拡張用のため現在は使用しないが、API仕様として受け取る
        _ = (width, height)
        
        filename = file.filename or "upload.pdf"
        # 1. 元ファイルをDriveへ保存 (The Vault)
        source_file_id = drive_service.upload_stream(file.file, filename, file.content_type)

        # 2. Driveからストリームを取得して加工 (The Eye)
        source_stream = drive_service.get_file_stream(source_file_id)
        new_pdf = editor.apply_mark(source_stream.getvalue(), x, y, "box", page)

        # 3. 加工済みファイルをDriveへ保存
        processed_filename = f"processed_{filename}"
        processed_stream = io.BytesIO(new_pdf)
        processed_file_id = drive_service.upload_stream(
            processed_stream,
            processed_filename,
            "application/pdf",
        )

        # 4. フロントエンドへ即時返却しつつ、DriveのIDもヘッダで返す
        return Response(
            content=new_pdf,
            media_type="application/pdf",
            headers={"X-File-Id": processed_file_id},
        )
    except Exception as e:
        return Response(f"Error: {str(e)}", status_code=500)


# --- 2. 並べ替え機能 ---
@app.post("/api/edit/reorder")
async def reorder_pages(
    file: UploadFile = File(...),
    order: str = Form(...),
):
    try:
        content = await file.read()
        new_pdf = editor.reorder_pdf(content, order)
        return Response(content=new_pdf, media_type="application/pdf")
    except Exception as e:
        return Response(f"Error: {str(e)}", status_code=500)


# --- 3. メタデータ取得 ---
@app.post("/api/pdf/info")
async def get_pdf_info(file: UploadFile = File(...)):
    try:
        content = await file.read()
        count = editor.get_page_count(content)
        return JSONResponse({"page_count": count})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# --- 4. 監査機能 (The Brain & Trojan Horse) ---

# 機能A: 差分検知 (Diff Engine)
@app.post("/api/audit/diff")
async def audit_diff(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
):
    try:
        # Shift-JIS / UTF-8 自動判定付きで読み込み
        old_data = await audit_service.ingest_csv(old_file)
        new_data = await audit_service.ingest_csv(new_file)
        
        # 指紋ベースの差分検知を実行
        diff_report = audit_service.detect_changes(old_data, new_data)
        return JSONResponse(diff_report)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# 機能B: 単一CSV読み込み (Ingestion)
@app.post("/api/audit/csv")
async def audit_csv(file: UploadFile = File(...)):
    try:
        records = await audit_service.ingest_csv(file)
        return JSONResponse({"records": records})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3100)