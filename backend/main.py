import fitz # PyMuPDF
from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import base64

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. PDF情報取得 ---
@app.post("/api/pdf/info")
async def get_pdf_info(file: UploadFile = File(...)):
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        return {"page_count": len(doc), "pageCount": len(doc)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 2. ハイライト/マーカー ---
@app.post("/api/highlight")
async def highlight_pdf(
    file: UploadFile = File(...),
    page: int = Form(...),
    x: float = Form(...),
    y: float = Form(...),
    width: float = Form(...),
    height: float = Form(...),
    type: str = Form("marker")
):
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        
        if 0 <= page < len(doc):
            p = doc[page]
            rect = fitz.Rect(x, y, x + float(width), y + float(height))
            if type == "box":
                p.draw_rect(rect, color=(1, 0, 0), width=3)
            else:
                annot = p.add_highlight_annot(rect)
                annot.set_colors(stroke=(1, 1, 0))
                annot.update()
        
        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        output_buffer.seek(0)
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")

    except Exception as e:
        print(f"Highlight Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 3. ページ並べ替え ---
@app.post("/api/edit/reorder")
async def reorder_pdf(
    file: UploadFile = File(...),
    order: str = Form(...)
):
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
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")

    except Exception as e:
        print(f"Reorder Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 4. サムネイル取得 (NEW!) ---
@app.post("/api/pdf/thumbnails")
async def get_pdf_thumbnails(file: UploadFile = File(...)):
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        thumbnails = []
        
        for page in doc:
            # 解像度を落として軽量化 (matrix=0.3)
            pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3)) 
            img_data = pix.tobytes("png")
            b64_str = base64.b64encode(img_data).decode("utf-8")
            thumbnails.append(f"data:image/png;base64,{b64_str}")
        
        return JSONResponse(content={"thumbnails": thumbnails})

    except Exception as e:
        print(f"Thumbnail Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)})