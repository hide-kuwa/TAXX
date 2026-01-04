"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, History, Columns, Check, MessageCircle, X,
  ArrowUpDown, Highlighter, Square, AlertCircle, Grip, Save, ZoomIn
} from "lucide-react";
import { DocVersion, UploadStatus } from "./types";

interface ViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  pdfUrl: string | null;
  pageCount: number | null;
  uploadStatus: UploadStatus;
  isLoading: boolean;
  onHighlight: (type: "box" | "marker") => Promise<File | void>;
  onReorder: (newOrder: number[]) => Promise<File | void>;
  onGetThumbnails: () => Promise<string[]>; // 追加
}

const INITIAL_HISTORY: DocVersion[] = [
  { ver: "v1.0", date: "2024/05/15 11:00", user: "田中 (担当)", action: "初版アップロード", status: "draft" },
];

export default function ViewerModal({
  isOpen, onClose, file, pdfUrl, pageCount, uploadStatus, isLoading,
  onHighlight, onReorder, onGetThumbnails
}: ViewerModalProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<DocVersion[]>(INITIAL_HISTORY);
  const [activeVerIdx, setActiveVerIdx] = useState(0);
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);

  const [isReordering, setIsReordering] = useState(false);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]); // サムネイル画像
  const [zoomImage, setZoomImage] = useState<string | null>(null); // ズーム用

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 初期化 & ファイル更新時のリセット
  useEffect(() => {
    if (isOpen && file && pdfUrl) {
      setHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) newHistory[0] = { ...newHistory[0], file: file };
        return newHistory;
      });
      setInternalPreviewUrl(pdfUrl);
      setActiveVerIdx(0);
      setIsReordering(false);
      
      // ★修正: ファイルが変わるたびにサムネイルを取得＆順序リセット
      onGetThumbnails().then(imgs => setThumbnails(imgs));
    }
  }, [isOpen, file, pdfUrl, onGetThumbnails]);

  // ★修正: ページ順序のリセットロジックを強化 (ファイル依存を追加)
  useEffect(() => {
    if (pageCount) {
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
    }
  }, [pageCount, file]); 

  // プレビュー切り替え
  useEffect(() => {
    const targetVer = history[activeVerIdx];
    if (targetVer && targetVer.file) {
      const objectUrl = URL.createObjectURL(targetVer.file);
      setInternalPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setInternalPreviewUrl(null);
    }
  }, [activeVerIdx, history]);

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    dragOverItem.current = position;
    if (dragItem.current !== null && dragItem.current !== position) {
        const newOrder = [...pageOrder];
        const draggedContent = newOrder[dragItem.current];
        newOrder.splice(dragItem.current, 1);
        newOrder.splice(position, 0, draggedContent);
        setPageOrder(newOrder);
        dragItem.current = position;
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleEditAction = async (actionType: "box" | "marker") => {
    if (!file) return;
    const newFile = await onHighlight(actionType);
    if (newFile) addHistory(newFile, actionType === "box" ? "赤枠追加" : "マーカー追加");
  };

  const handleSaveReorder = async () => {
    if (!file) return;
    const newFile = await onReorder(pageOrder);
    if (newFile) {
        addHistory(newFile, "ページ並べ替え");
        setIsReordering(false);
    }
  };

  const addHistory = (newFile: File | void, actionName: string) => {
    if (!newFile) return;
    const date = new Date().toLocaleString("ja-JP", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    setHistory((prev) => {
        const nextVerNum = prev.length + 1;
        return [{
            ver: `v${nextVerNum}.0`,
            date, user: "田中 (担当)", action: actionName, status: "fix", file: newFile as File,
        }, ...prev];
    });
    setActiveVerIdx(0);
    setIsHistoryOpen(true);
  };

  if (!isOpen) return null;
  const activeVersion = history[activeVerIdx] || { ver: "---", action: "", status: "draft" };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none overflow-hidden">
      <div className="relative flex h-full flex-1 flex-col transition-all duration-300" style={{ marginRight: isHistoryOpen ? "300px" : "0" }}>
        <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> 戻る</button>
            <div className="h-6 w-px bg-slate-600"></div>
            <h2 className="text-sm font-bold text-white max-w-[200px] truncate">{file ? file.name : "Document"}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${activeVersion.status === "done" ? "bg-green-600" : activeVersion.status === "fix" ? "bg-blue-600" : "bg-slate-600"}`}>{activeVersion.ver} {activeVersion.action}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 rounded-lg p-1 mr-2 border border-slate-700">
               {!isReordering && (
                   <>
                    <button onClick={() => handleEditAction("marker")} disabled={isLoading} className="p-1.5 text-yellow-400 hover:bg-slate-700 rounded transition-colors"><Highlighter className="h-4 w-4" /></button>
                    <button onClick={() => handleEditAction("box")} disabled={isLoading} className="p-1.5 text-red-500 hover:bg-slate-700 rounded transition-colors"><Square className="h-4 w-4" /></button>
                   </>
               )}
              <button onClick={() => setIsReordering(!isReordering)} disabled={isLoading} className={`p-1.5 rounded transition-colors flex items-center gap-1 ${isReordering ? "bg-blue-600 text-white" : "text-blue-400 hover:bg-slate-700"}`}>
                <ArrowUpDown className="h-4 w-4" /> {isReordering && <span className="text-xs font-bold pr-1">モード中</span>}
              </button>
            </div>
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 transition-colors ${isHistoryOpen ? "bg-blue-600 text-white border-blue-500" : "bg-slate-700 text-white hover:bg-slate-600"}`}><History className="h-4 w-4" /></button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-blue-600"><Columns className="h-4 w-4" /></button>
            <button onClick={onClose} className="flex items-center rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-green-500"><Check className="mr-1 h-3 w-3" /> 完了</button>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden bg-slate-100">
            {isReordering ? (
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-700">ページ並べ替え</h3>
                            <button onClick={handleSaveReorder} disabled={isLoading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-500 shadow-lg">
                                {isLoading ? "処理中..." : <><Save className="h-4 w-4" /> 順序を確定する</>}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pageOrder.map((pageIndex, i) => (
                                <div key={pageIndex} draggable onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                                    className="aspect-[1/1.4] bg-white rounded-lg border-2 border-slate-300 shadow-sm flex flex-col items-center cursor-move hover:border-blue-400 hover:shadow-md transition-all relative group overflow-hidden">
                                    <div className="absolute top-2 left-2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 z-10">{i + 1}</div>
                                    <div className="w-full h-full p-2 flex items-center justify-center bg-slate-50">
                                        {/* サムネイル表示 */}
                                        {thumbnails[pageIndex] ? (
                                            <img src={thumbnails[pageIndex]} alt={`Page ${pageIndex + 1}`} className="max-h-full max-w-full object-contain shadow-sm pointer-events-none" />
                                        ) : (
                                            <div className="text-xs text-slate-400">Loading...</div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                                    {/* 拡大ボタン */}
                                    <button onClick={(e) => { e.stopPropagation(); setZoomImage(thumbnails[pageIndex]); }} className="absolute top-2 right-2 p-1 bg-white/80 rounded hover:bg-white text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-20" title="拡大">
                                        <ZoomIn className="h-4 w-4" />
                                    </button>
                                    <Grip className="absolute bottom-2 right-2 h-4 w-4 text-slate-400 z-10" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex-1">
                    {internalPreviewUrl ? <embed key={internalPreviewUrl} src={internalPreviewUrl} type="application/pdf" className="h-full w-full" /> : <div className="absolute inset-0 flex items-center justify-center opacity-50"><AlertCircle className="h-24 w-24 text-slate-300" /></div>}
                </div>
            )}
        </div>
      </div>
      
      {/* ズームモーダル */}
      {zoomImage && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-10" onClick={() => setZoomImage(null)}>
              <img src={zoomImage} className="max-h-full max-w-full shadow-2xl rounded" />
              <button className="absolute top-4 right-4 text-white hover:text-red-400"><X className="h-8 w-8" /></button>
          </div>
      )}

      {/* 履歴パネル */}
      <div className={`absolute top-0 right-0 h-full bg-slate-800 border-l border-slate-700 transition-transform duration-300 z-30 w-[300px] flex flex-col shadow-2xl ${isHistoryOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 h-14"><span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Version History</span><button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button></div>
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute top-0 bottom-0 left-[29px] w-[2px] bg-slate-700 z-0"></div>
          {history.map((h, i) => (
            <div key={i} onClick={() => setActiveVerIdx(i)} className={`relative pl-8 mb-6 cursor-pointer group transition-opacity ${i === activeVerIdx ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
              <div className={`absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 border-white z-10 transition-transform ${i === activeVerIdx ? "bg-blue-500 scale-125" : "bg-slate-500 group-hover:bg-slate-400"}`}></div>
              <div className="text-[10px] text-slate-400 font-mono mb-0.5">{h.date}</div>
              <div className="text-sm font-bold text-white mb-0.5">{h.action}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">{h.user.charAt(0)}</span>{h.user}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}