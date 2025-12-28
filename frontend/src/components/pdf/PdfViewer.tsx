"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type Props = {
    file: File;
    activeTool: 'box' | 'marker';
    onEdit: (x: float, y: float, pageIndex: number) => void;
};

export default function PdfViewer({ file, activeTool, onEdit }: Props) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [currentPageIdx, setCurrentPageIdx] = useState(0);

    useEffect(() => {
        let active = true;
        const render = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1); // 簡易的に1ページ目を表示（ページ送りは必要なら後で追加）
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
                if (active) setImageUrl(canvas.toDataURL("image/png"));
            } catch (e) { console.error(e); }
        };
        setImageUrl(null);
        render();
        return () => { active = false; };
    }, [file]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        onEdit(x, y, currentPageIdx);
    };

    if (!imageUrl) return <div className="flex justify-center mt-20 text-white"><Loader2 className="animate-spin" size={40}/></div>;

    return (
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-900/50 h-full">
            <div className="relative shadow-2xl cursor-crosshair group h-fit">
                <img src={imageUrl} className="max-w-full h-auto pointer-events-none shadow-lg border border-slate-700" />
                <div onClick={handleClick} className="absolute inset-0 hover:bg-blue-500/10 transition-colors" />
            </div>
        </div>
    );
}