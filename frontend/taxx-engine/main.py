# taxx-engine/main.py
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import io

app = FastAPI()

# ★重要: Localhostからのアクセスを許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発中は全許可
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/highlight")
async def add_highlight(
    file: UploadFile = File(...),
    x: float = Form(...),
    y: float = Form(...)
):
    """
    PDFを受け取り、クリックした座標(x,y)に赤枠を焼き付けて返す
    """
    try:
        print(f"Processing: x={x}, y={y}") # ログ確認用
        
        # メモリ上でPDFを開く
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        page = doc[0] # とりあえず1ページ目
        
        # 座標計算 (相対座標 -> 絶対座標)
        width, height = page.rect.width, page.rect.height
        rect_size = 50
        center_x, center_y = x * width, y * height
        
        # 赤枠を描画
        rect = fitz.Rect(center_x - rect_size/2, center_y - rect_size/2, center_x + rect_size/2, center_y + rect_size/2)
        page.draw_rect(rect, color=(1, 0, 0), width=3)
        
        # 保存して返す
        output = io.BytesIO()
        doc.save(output)
        return Response(content=output.getvalue(), media_type="application/pdf")
        
    except Exception as e:
        print(f"Error: {e}")
        return Response(content=str(e), status_code=500)

if __name__ == "__main__":
    # ポート3100で起動
    uvicorn.run(app, host="0.0.0.0", port=3100)