# backend/main.py
import io

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import uvicorn
from PDF import editor
from services.drive import DriveService
from services.audit_core import AuditService

app = FastAPI()

drive_service = DriveService()
audit_service = AuditService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "TAXX Engine V3.1 Running"}


# --- 1. 編集機能 ---
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
        _ = (width, height)
        filename = file.filename or "upload.pdf"
        source_file_id = drive_service.upload_stream(file.file, filename, file.content_type)

        source_stream = drive_service.get_file_stream(source_file_id)
        new_pdf = editor.apply_mark(source_stream.getvalue(), x, y, "box", page)

        processed_filename = f"processed_{filename}"
        processed_stream = io.BytesIO(new_pdf)
        processed_file_id = drive_service.upload_stream(
            processed_stream,
            processed_filename,
            "application/pdf",
        )

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


# --- 3. メタデータ取得 (★ここが404の原因でした！これを追加します) ---
@app.post("/api/pdf/info")
async def get_pdf_info(file: UploadFile = File(...)):
    try:
        content = await file.read()
        count = editor.get_page_count(content)
        return JSONResponse({"page_count": count})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/audit/diff")
async def audit_diff(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
):
    try:
        old_data = await audit_service.ingest_csv(old_file)
        new_data = await audit_service.ingest_csv(new_file)
        diff_report = audit_service.detect_changes(old_data, new_data)
        return JSONResponse(diff_report)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3100)
