"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { ArrowLeft, FileText, Grid as GridIcon, Loader2, Download } from "lucide-react";
import PdfViewer from "./PdfViewer";
import PdfGridSorter from "./PdfGridSorter";

type Props = {
    file: File;
    onClose: () => void;
};

export default function LocalPdfEditor({ file, onClose }: Props) {
    const [mode, setMode] = useState<'view' | 'grid'>('view');
    const [currentFile, setCurrentFile] = useState<File>(file);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTool, setActiveTool] = useState<'box' | 'marker'>('box');
    
    // ページ順序管理
    const [pagesOrder, setPagesOrder] = useState<number[]>([]);

    // 初期化：ページ数取得
    useEffect(() => {
        const init = async () => {
            const formData = new FormData();
            formData.append("file", currentFile);
            try {
                const res = await fetch("http://localhost:3100/api/pdf/info", { method: "POST", body: formData });
                const data = await res.json();
                setPagesOrder(Array.from({ length: data.page_count }, (_, i) => i));
            } catch (e) { console.error(e); }
        };
        init();
    }, [currentFile]);

    // 赤枠・マーカー処理
    const handleEdit = async (x: number, y: number, pageIndex: number) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append("file", currentFile);
            formData.append("x", x.toString());
            formData.append("y", y.toString());
            formData.append("page", pageIndex.toString());
            formData.append("width", "0");
            formData.append("height", "0");
            const res = await fetch("http://localhost:3100/api/highlight", { method: "POST", body: formData });
            const blob = await res.blob();
            setCurrentFile(new File([blob], currentFile.name, { type: "application/pdf" }));
        } catch (e) { alert("エラー"); } finally { setIsProcessing(false); }
    };

    // 並べ替え処理
    const handleReorder = async (newOrder: number[]) => {
        setPagesOrder(newOrder); // 先に見た目更新
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append("file", currentFile);
            formData.append("order", JSON.stringify(newOrder));
            const res = await fetch("http://localhost:3100/api/edit/reorder", { method: "POST", body: formData });
            const blob = await res.blob();
            // ファイル更新＆オーダーリセット（PDF自体が変わるため）
            setCurrentFile(new File([blob], currentFile.name, { type: "application/pdf" }));
            setPagesOrder(Array.from({ length: newOrder.length }, (_, i) => i));
        } catch(e) { console.error(e); } finally { setIsProcessing(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
            {/* ツールバー */}
            <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded flex items-center gap-2 text-sm font-bold text-slate-300">
                        <ArrowLeft size={16}/> 閉じる
                    </button>
                    <div className="font-bold text-white">{currentFile.name}</div>
                </div>

                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button onClick={() => setMode('view')} className={clsx("px-4 py-2 rounded-md text-sm font-bold flex gap-2", mode === 'view' ? "bg-blue-600 text-white" : "text-slate-400")}>
                        <FileText size={16}/> 編集
                    </button>
                    <button onClick={() => setMode('grid')} className={clsx("px-4 py-2 rounded-md text-sm font-bold flex gap-2", mode === 'grid' ? "bg-blue-600 text-white" : "text-slate-400")}>
                        <GridIcon size={16}/> 並べ替え
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                     {mode === 'view' && (
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setActiveTool('box')} className={clsx("px-3 py-1.5 rounded text-xs font-bold", activeTool === 'box' ? "bg-red-500 text-white" : "text-slate-400")}>赤枠</button>
                            <button onClick={() => setActiveTool('marker')} className={clsx("px-3 py-1.5 rounded text-xs font-bold", activeTool === 'marker' ? "bg-yellow-400 text-black" : "text-slate-400")}>マーカー</button>
                        </div>
                     )}
                     <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold flex gap-2"><Download size={16}/> 保存</button>
                </div>
            </div>

            {/* メインエリア切り替え */}
            <div className="flex-1 overflow-hidden relative">
                {mode === 'view' ? (
                    <PdfViewer file={currentFile} activeTool={activeTool} onEdit={handleEdit} />
                ) : (
                    <PdfGridSorter file={currentFile} pagesOrder={pagesOrder} onReorder={handleReorder} />
                )}
                
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white px-8 py-6 rounded-xl flex flex-col items-center shadow-2xl animate-bounce-small">
                            <Loader2 className="text-blue-600 animate-spin mb-4" size={40}/>
                            <div className="text-lg font-bold text-slate-900">処理中...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
