"use client";

import { useState, useEffect } from "react";
import type { DragEvent } from "react";
import { clsx } from "clsx";
import { Loader2, X } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const arrayMove = (items: number[], from: number, to: number) => {
    const updated = [...items];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    return updated;
};

// --- 小部品: サムネイルカード ---
function SortableThumbnail({
    id,
    thumbnail,
    pageNum,
    isActive,
    isDragging,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: {
    id: number;
    thumbnail: string;
    pageNum: number;
    isActive: boolean;
    isDragging: boolean;
    onDragStart: (id: number) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (id: number) => void;
    onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(id)}
      onDragEnd={onDragEnd}
      className={clsx(
        "relative group aspect-[1/1.4] bg-white rounded shadow-sm border-2 transition-all",
        isDragging && "opacity-60 ring-2 ring-blue-500",
        isActive ? "border-blue-500 ring-2 ring-blue-500" : "border-transparent hover:border-slate-300"
      )}
    >
      {thumbnail ? (
        <img src={thumbnail} className="w-full h-full object-contain p-1" alt={`Page ${pageNum}`} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300"><Loader2 className="animate-spin"/></div>
      )}
      <div className="absolute bottom-1 right-2 text-[10px] font-bold text-slate-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
        {pageNum}
      </div>
    </div>
  );
}

// --- メイン: 並べ替えコンポーネント ---
type Props = {
    file: File;
    pagesOrder: number[];
    onReorder: (newOrder: number[]) => void;
};

export default function PdfGridSorter({ file, pagesOrder, onReorder }: Props) {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // サムネイル生成
    useEffect(() => {
        const generate = async () => {
            if (thumbnails.length > 0) return;
            setLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await getDocument({ data: arrayBuffer }).promise;
                const newThumbs = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 });
                    const canvas = document.createElement("canvas");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
                    newThumbs.push(canvas.toDataURL());
                }
                setThumbnails(newThumbs);
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        generate();
    }, [file]);

    if (loading && thumbnails.length === 0) {
        return <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4"><Loader2 className="animate-spin text-blue-500" size={48}/><div>サムネイル生成中...</div></div>;
    }

    const handleDragStart = (id: number) => {
        setDraggingId(id);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (targetId: number) => {
        if (draggingId === null || draggingId === targetId) return;
        const oldIndex = pagesOrder.indexOf(draggingId);
        const newIndex = pagesOrder.indexOf(targetId);
        if (oldIndex === -1 || newIndex === -1) return;
        onReorder(arrayMove(pagesOrder, oldIndex, newIndex));
    };

    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-100/5">
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
                {pagesOrder.map((pageIdx, idx) => (
                    <SortableThumbnail
                        key={pageIdx}
                        id={pageIdx}
                        thumbnail={thumbnails[pageIdx] || ""}
                        pageNum={idx + 1}
                        isActive={false}
                        isDragging={draggingId === pageIdx}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={() => setDraggingId(null)}
                    />
                ))}
            </div>
        </div>
    );
}
