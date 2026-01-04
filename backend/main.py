import fitz # PyMuPDF
from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import base64
from typing import List

app = FastAPI()

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

# --- 2. 編集・描画 (大幅強化) ---
@app.post("/api/highlight")
async def highlight_pdf(
    file: UploadFile = File(...),
    page: int = Form(...),
    # 0.0〜1.0の正規化座標 (画面上の比率) で受け取る
    x: float = Form(...), 
    y: float = Form(...),
    w: float = Form(...),
    h: float = Form(...),
    type: str = Form("marker") # marker, box, line, check
):
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
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 4. サムネイル取得 ---
@app.post("/api/pdf/thumbnails")
async def get_pdf_thumbnails(file: UploadFile = File(...)):
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        thumbnails = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3)) 
            img_data = pix.tobytes("png")
            b64_str = base64.b64encode(img_data).decode("utf-8")
            thumbnails.append(f"data:image/png;base64,{b64_str}")
        return JSONResponse(content={"thumbnails": thumbnails})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 5. PDF結合 ---
@app.post("/api/edit/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    try:
        merged_doc = fitz.open()
        for file in files:
            content = await file.read()
            doc = fitz.open("pdf", content)
            merged_doc.insert_pdf(doc)
        output_buffer = io.BytesIO()
        merged_doc.save(output_buffer)
        output_buffer.seek(0)
        return Response(content=output_buffer.getvalue(), media_type="application/pdf")
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# --- 6. ページ画像レンダリング (NEW!) ---
# 編集用に高画質(matrix=2.0)で1ページだけ取得する
@app.post("/api/pdf/render")
async def render_pdf_page(
    file: UploadFile = File(...),
    page: int = Form(...)
):
    try:
        content = await file.read()
        doc = fitz.open("pdf", content)
        if 0 <= page < len(doc):
            p = doc[page]
            pix = p.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img_data = pix.tobytes("png")
            return Response(content=img_data, media_type="image/png")
        else:
            return JSONResponse(status_code=400, content={"message": "Page out of range"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})