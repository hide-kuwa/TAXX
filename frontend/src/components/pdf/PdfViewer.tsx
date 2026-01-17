"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
// react-pdf への依存を排除し、pdfjs-dist を直接使用
import * as pdfjsLib from "pdfjs-dist";

// Workerの設定 (CDNを利用してローカルビルドの問題を回避)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Props = {
    file: File;
    activeTool: "box" | "marker";
    onEdit: (x: number, y: number, pageIndex: number) => void;
};

type PageMeta = {
    scale: number;
    width: number;
    height: number;
};

export default function PdfViewer({ file, activeTool, onEdit }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);
    const [currentPageIdx, setCurrentPageIdx] = useState(0);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        let active = true;
        const render = async () => {
            try {
                setIsRendering(true);
                const arrayBuffer = await file.arrayBuffer();
                
                // pdfjs-dist を使ってドキュメントをロード
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                // 1ページ目を取得 (インデックスは1始まり)
                const page = await pdf.getPage(1);
                
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                const canvas = canvasRef.current;
                if (!canvas) return;
                
                const context = canvas.getContext("2d");
                if (!context) return;
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Canvasにレンダリング
                await page.render({ canvasContext: context, viewport }).promise;
                
                if (active) {
                    setPageMeta({ scale, width: viewport.width, height: viewport.height });
                    setIsRendering(false);
                }
            } catch (e) {
                console.error("PDF Render Error:", e);
                if (active) setIsRendering(false);
            }
        };
        
        render();
        
        return () => {
            active = false;
        };
    }, [file]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!pageMeta) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        // Canvas上のクリック位置
        const renderX = e.clientX - rect.left;
        const renderY = e.clientY - rect.top;
        
        const normalizedX = renderX / pageMeta.width;
        const normalizedY = renderY / pageMeta.height;

        onEdit(normalizedX, normalizedY, currentPageIdx);
    };

    if (isRendering) {
        return (
            <div className="flex justify-center mt-20 text-white">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-900/50 h-full">
            <div className="relative shadow-2xl cursor-crosshair group h-fit">
                <canvas
                    ref={canvasRef}
                    onClick={handleClick}
                    className="max-w-full h-auto shadow-lg border border-slate-700 hover:bg-blue-500/10 transition-colors"
                />
            </div>
        </div>
    );
}
