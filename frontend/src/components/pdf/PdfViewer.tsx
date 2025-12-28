"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
                const pdf = await getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1); // 簡易的に1ページ目を表示（ページ送りは必要なら後で追加）
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext("2d");
                if (!context) return;
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: context, viewport }).promise;
                if (active) {
                    setPageMeta({ scale, width: viewport.width, height: viewport.height });
                    setIsRendering(false);
                }
            } catch (e) {
                console.error(e);
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
        const renderX = e.clientX - rect.left;
        const renderY = e.clientY - rect.top;
        const pdfX = renderX / pageMeta.scale;
        const pdfY = renderY / pageMeta.scale;
        console.log("PDF click coordinates", { x: pdfX, y: pdfY, pageIndex: currentPageIdx });
        onEdit(pdfX, pdfY, currentPageIdx);
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
