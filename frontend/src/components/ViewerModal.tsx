"use client";

import { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft, History, Columns, Check, MessageCircle, X,
  ArrowUpDown, Highlighter, Square, AlertCircle, Grip, Save, ZoomIn, Plus, 
  PenTool, CheckCircle2, Minus, FileUp, Send, UserCheck, ChevronDown, ChevronRight, Split, Upload, AlertTriangle, PlayCircle, PauseCircle, Stamp
} from "lucide-react";
import { DocVersion, UploadStatus } from "./types";

type ToolType = "none" | "marker" | "box" | "line" | "check";

// ステータス定義を拡張
type WorkflowStatus = 'draft' | 'review_pending' | 'auditing' | 'done' | 'rejected' | 'fix';

interface EnhancedDocVersion extends Omit<DocVersion, 'status'> {
  status: WorkflowStatus;
  actionsLog: string[];
  isMajor: boolean;
}

interface ViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  pdfUrl: string | null;
  pageCount: number | null;
  uploadStatus: UploadStatus;
  isLoading: boolean;
  onHighlight: (type: "box" | "marker" | "line" | "check", page: number, rect: { x: number, y: number, w: number, h: number }) => Promise<File | void>;
  onReorder: (newOrder: number[]) => Promise<File | void>;
  onMerge: (files: File[]) => Promise<File | void>;
  onGetThumbnails: () => Promise<string[]>;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
}

const INITIAL_HISTORY: EnhancedDocVersion[] = [
  { ver: "v1.0.0", date: "2024/05/15 11:00", user: "田中 (担当)", action: "初版アップロード", status: "draft", isMajor: true, actionsLog: ["ファイルアップロード"] },
];

export default function ViewerModal({
  isOpen, onClose, file, pdfUrl, pageCount, uploadStatus, isLoading,
  onHighlight, onReorder, onMerge, onGetThumbnails, onRenderPage
}: ViewerModalProps) {
  // --- UI State ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  
  // --- Data State ---
  const [history, setHistory] = useState<EnhancedDocVersion[]>(INITIAL_HISTORY);
  const [activeVerIdx, setActiveVerIdx] = useState(0);
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  
  // 監査用
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [comparePreviewUrl, setComparePreviewUrl] = useState<string | null>(null);

  const [unsavedActions, setUnsavedActions] = useState<string[]>([]);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(null);

  // --- Edit Mode State ---
  const [isReordering, setIsReordering] = useState(false);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("none");
  const [editPageImage, setEditPageImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Handlers ---

  const onDropAppend = async (acceptedFiles: File[]) => {
    if (!file || acceptedFiles.length === 0) return;
    const newFile = await onMerge([file, ...acceptedFiles]);
    if (newFile) recordAction(newFile, `PDF結合 (+${acceptedFiles.length}ファイル)`);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAppend, accept: { "application/pdf": [".pdf"] }, multiple: true, noClick: true
  });

  const onDropReference = (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          setReferenceFile(acceptedFiles[0]);
      }
  };
  const { 
      getRootProps: getRefRootProps, 
      getInputProps: getRefInputProps, 
      isDragActive: isRefDragActive 
  } = useDropzone({
      onDrop: onDropReference, accept: { "application/pdf": [".pdf"] }, multiple: false
  });

  // 初期化
  useEffect(() => {
    if (isOpen && file && pdfUrl) {
      setHistory(prev => {
         const newHistory = [...prev];
         if(newHistory.length > 0) newHistory[0] = {...newHistory[0], file: file}; 
         return newHistory; 
      });
      setInternalPreviewUrl(pdfUrl);
      if (activeVerIdx === 0 && unsavedActions.length === 0) setUnsavedActions([]); 
      onGetThumbnails().then(imgs => setThumbnails(imgs));
    }
  }, [file, pdfUrl]); 

  useEffect(() => {
    if(isOpen) {
        setActiveVerIdx(0); 
        setIsReordering(false); 
        setActiveTool("none"); 
        setExpandedHistoryIdx(null);
        setIsSplitView(false);
        setReferenceFile(null);
    }
  }, [isOpen]);

  useEffect(() => { if (pageCount) setPageOrder(Array.from({ length: pageCount }, (_, i) => i)); }, [pageCount]);

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

  useEffect(() => {
    if (isSplitView) {
        let targetFile: File | null = null;
        if (referenceFile) {
            targetFile = referenceFile;
        } else {
            const compareIdx = Math.min(activeVerIdx + 1, history.length - 1);
            const compareVer = history[compareIdx];
            if (compareVer) targetFile = compareVer.file;
        }
        if (targetFile) {
            const objectUrl = URL.createObjectURL(targetFile);
            setComparePreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    } else {
        setComparePreviewUrl(null);
    }
  }, [isSplitView, activeVerIdx, history, referenceFile]);

  useEffect(() => {
    if (activeTool !== "none" && !editPageImage) {
        onRenderPage(0).then(url => { if (url) setEditPageImage(url); });
    }
  }, [activeTool, onRenderPage, editPageImage]);


  const recordAction = (newFile: File | void, actionName: string) => {
    if (!newFile) return;
    setUnsavedActions(prev => [actionName, ...prev]);
    setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) newHistory[0] = { ...newHistory[0], file: newFile as File };
        return newHistory;
    });
  };

  // --- ★バージョン作成・ワークフロー遷移 ---
  const createNewVersion = (
      type: 'minor' | 'major' | 'audit_start', 
      actionTitle: string, 
      status: WorkflowStatus, 
      user: string
  ) => {
    if (!file) return;
    const date = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    
    setHistory(prev => {
        const currentVerStr = prev[0].ver;
        const parts = currentVerStr.replace('v', '').split('.').map(Number);
        let [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];

        if (type === 'audit_start') {
            // 監査開始: v2.0.0 へ
            major = 2; minor = 0; patch = 0;
        } else if (type === 'major') {
            // 完了: メジャーUP
            major += 1; minor = 0; patch = 0;
        } else {
            // 作業保存: マイナーUP
            minor += 1; patch = 0;
        }

        const newVerStr = `v${major}.${minor}.${patch}`;
        const logsToSave = unsavedActions.length > 0 ? [...unsavedActions] : ["変更なし"];
        
        const newVersion: EnhancedDocVersion = { 
            ver: newVerStr, date, user, action: actionTitle, status, file: file, actionsLog: logsToSave, 
            isMajor: type === 'major' || type === 'audit_start'
        };
        return [newVersion, ...prev];
    });
    setUnsavedActions([]); setActiveVerIdx(0); setIsHistoryOpen(true);
  };

  // --- ボタンハンドラ群 ---

  // Aさん: 作業保存 (v1.x -> v1.x+1)
  const handleWorkSave = () => {
      createNewVersion('minor', `作業保存 (${unsavedActions.length}件の変更)`, 'fix', "田中 (担当)");
  };

  // Aさん: 承認依頼 (ステータス変更のみ、バージョンは維持またはminor)
  const handleRequestReview = () => {
      if(confirm("承認依頼を出しますか？")) {
          createNewVersion('minor', "承認依頼 (監査待ち)", 'review_pending', "田中 (担当)");
      }
  };
  
  // Bさん: 監査開始 (v1.x -> v2.0.0)
  const handleStartAudit = () => {
      createNewVersion('audit_start', "監査開始", 'auditing', "佐藤 (上司)");
      setIsSplitView(true);
  };

  // Bさん: 監査中断 (v2.x -> v2.x+1)
  const handleAuditSuspend = () => {
      createNewVersion('minor', "監査中断 (一時保存)", 'auditing', "佐藤 (上司)");
  };

  // Bさん: 差戻 (v2.x -> v2.x+1)
  const handleRemand = () => {
      const reason = prompt("差戻しの理由を入力してください", "修正が必要です");
      if (reason) {
          createNewVersion('minor', `差戻: ${reason}`, 'rejected', "佐藤 (上司)");
          setIsSplitView(false);
      }
  };

  // Bさん: 承認完了 (v2.x -> v3.0.0)
  const handleApprove = () => {
      if(confirm("この内容で承認し、次のフローへ進みますか？")) {
          createNewVersion('major', "承認完了", 'done', "佐藤 (上司)");
          setIsSplitView(false);
      }
  };

  // アノテーション処理
  const applyAnnotation = async (type: ToolType, rect: {x:number, y:number, w:number, h:number}) => {
    if (type === "none" || !file) return;
    const newFile = await onHighlight(type, 0, rect);
    if (newFile) {
        let actionName = "";
        if (type === "marker") actionName = "マーカー";
        if (type === "box") actionName = "赤枠";
        if (type === "line") actionName = "ライン";
        if (type === "check") actionName = "チェック";
        
        recordAction(newFile, actionName);
        const newImg = await onRenderPage(0, newFile as File);
        if (newImg) setEditPageImage(newImg);
    }
  };

  const handleSaveReorder = async () => {
    if (!file) return;
    const newFile = await onReorder(pageOrder);
    if(newFile) { recordAction(newFile, "ページ並べ替え"); setIsReordering(false); }
  };

  const getNormalizedPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "none" || activeTool === "check") return;
    setIsDrawing(true); const pos = getNormalizedPos(e); setStartPos(pos); setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;
    const pos = getNormalizedPos(e);
    setCurrentRect({ x: Math.min(startPos.x, pos.x), y: Math.min(startPos.y, pos.y), w: Math.abs(pos.x - startPos.x), h: Math.abs(pos.y - startPos.y) });
  };
  const handleMouseUp = async (e: React.MouseEvent) => {
    if (activeTool === "check") {
        const pos = getNormalizedPos(e); await applyAnnotation("check", { x: pos.x - 0.025, y: pos.y - 0.025, w: 0.05, h: 0.05 }); return;
    }
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 0.01 || currentRect.h > 0.01) await applyAnnotation(activeTool, currentRect);
    setStartPos(null); setCurrentRect(null);
  };

  const handleDragStart = (e: React.DragEvent, position: number) => { dragItem.current = position; e.currentTarget.classList.add("opacity-50"); };
  const handleDragEnter = (e: React.DragEvent, position: number) => {
    e.preventDefault(); dragOverItem.current = position;
    if (dragItem.current !== null && dragItem.current !== position) {
        const newOrder = [...pageOrder]; const draggedContent = newOrder[dragItem.current]; newOrder.splice(dragItem.current, 1); newOrder.splice(position, 0, draggedContent); setPageOrder(newOrder); dragItem.current = position;
    }
  };
  const handleDragEnd = (e: React.DragEvent) => { e.currentTarget.classList.remove("opacity-50"); dragItem.current = null; dragOverItem.current = null; };

  if (!isOpen) return null;
  const activeVersion = history[activeVerIdx] || { ver: "---", action: "", status: "draft" };
  
  // ★重要: 現在の状態判定
  const isDraft = activeVersion.status === 'draft' || activeVersion.status === 'fix' || activeVersion.status === 'rejected';
  const isReviewPending = activeVersion.status === 'review_pending';
  const isAuditing = activeVersion.status === 'auditing';
  const isDone = activeVersion.status === 'done';

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none overflow-hidden">
      <div className="relative flex h-full flex-1 flex-col transition-all duration-300" style={{ marginRight: isHistoryOpen ? "320px" : "0" }}>
        
        {/* --- Header --- */}
        <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> 戻る</button>
            <div className="h-6 w-px bg-slate-600"></div>
            <h2 className="text-sm font-bold text-white max-w-[200px] truncate">{file ? file.name : "Document"}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white 
                ${isDone ? "bg-green-600" : 
                  activeVersion.status === "rejected" ? "bg-red-600" : 
                  isAuditing ? "bg-yellow-600" : 
                  isReviewPending ? "bg-purple-600" : "bg-slate-600"}`
            }>
                {activeVersion.ver} {activeVersion.action}
            </span>
            {unsavedActions.length > 0 && <span className="text-[10px] text-yellow-400 font-bold flex items-center animate-pulse"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>未保存: {unsavedActions.length}</span>}
          </div>
          <div className="flex items-center gap-3">
            
            <div className="flex items-center bg-slate-900 rounded-lg p-1 mr-2 border border-slate-700">
               {!isReordering && (
                   <>
                    <button onClick={() => setActiveTool(activeTool === "marker" ? "none" : "marker")} disabled={isLoading} className={`p-1.5 rounded transition-colors ${activeTool==="marker" ? "bg-yellow-900 text-yellow-400" : "text-yellow-400 hover:bg-slate-700"}`}><Highlighter className="h-4 w-4" /></button>
                    <button onClick={() => setActiveTool(activeTool === "box" ? "none" : "box")} disabled={isLoading} className={`p-1.5 rounded transition-colors ${activeTool==="box" ? "bg-red-900 text-red-500" : "text-red-500 hover:bg-slate-700"}`}><Square className="h-4 w-4" /></button>
                    <button onClick={() => setActiveTool(activeTool === "line" ? "none" : "line")} disabled={isLoading} className={`p-1.5 rounded transition-colors ${activeTool==="line" ? "bg-blue-900 text-blue-400" : "text-blue-400 hover:bg-slate-700"}`}><Minus className="h-4 w-4 transform -rotate-45" /></button>
                    <button onClick={() => setActiveTool(activeTool === "check" ? "none" : "check")} disabled={isLoading} className={`p-1.5 rounded transition-colors ${activeTool==="check" ? "bg-green-900 text-green-500" : "text-green-500 hover:bg-slate-700"}`}><CheckCircle2 className="h-4 w-4" /></button>
                   </>
               )}
               <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button onClick={() => setIsReordering(!isReordering)} disabled={isLoading} className={`p-1.5 rounded transition-colors flex items-center gap-1 ${isReordering ? "bg-blue-600 text-white" : "text-blue-400 hover:bg-slate-700"}`}>
                <ArrowUpDown className="h-4 w-4" /> {isReordering && <span className="text-xs font-bold pr-1">モード中</span>}
              </button>
            </div>

            {/* ★監査ワークフロー対応のボタン出し分け --- */}
            
            {/* Phase 1: 担当者作業中 (Draft) */}
            {isDraft && (
                <>
                    <button onClick={handleWorkSave} disabled={isLoading || unsavedActions.length === 0} className="flex items-center gap-1 bg-slate-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Save className="h-3 w-3" />
                        <span className="text-xs font-bold">作業保存</span>
                    </button>
                    <button onClick={handleRequestReview} disabled={isLoading} className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg border border-blue-600 transition-colors shadow-lg ml-1">
                        <Send className="h-3 w-3" />
                        <span className="text-xs font-bold">承認依頼</span>
                    </button>
                </>
            )}

            {/* Phase 2: 監査待ち (Review Pending) */}
            {isReviewPending && (
                <button onClick={handleStartAudit} className="flex items-center gap-1 bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg border border-purple-600 transition-colors shadow-lg animate-pulse">
                    <PlayCircle className="h-3 w-3" />
                    <span className="text-xs font-bold">監査開始</span>
                </button>
            )}

            {/* Phase 3: 監査中 (Auditing) */}
            {isAuditing && (
                <>
                    <button onClick={handleAuditSuspend} disabled={isLoading} className="flex items-center gap-1 bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg border border-yellow-600 transition-colors">
                        <PauseCircle className="h-3 w-3" />
                        <span className="text-xs font-bold">中断・保存</span>
                    </button>
                    <button onClick={handleRemand} disabled={isLoading} className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg border border-red-700 transition-colors shadow-lg ml-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs font-bold">差戻</span>
                    </button>
                    <button onClick={handleApprove} disabled={isLoading} className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg border border-green-600 transition-colors shadow-lg ml-2">
                        <Stamp className="h-3 w-3" />
                        <span className="text-xs font-bold">承認完了</span>
                    </button>
                </>
            )}

            {/* Phase 4: 完了 (Done) */}
            {isDone && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-900/50 rounded-lg border border-green-800 text-green-400">
                    <Check className="h-3 w-3" />
                    <span className="text-xs font-bold">承認済み</span>
                </div>
            )}

            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 transition-colors ${isHistoryOpen ? "bg-blue-600 text-white border-blue-500" : "bg-slate-700 text-white hover:bg-slate-600"}`}><History className="h-4 w-4" /></button>
            <button onClick={() => setIsSplitView(!isSplitView)} className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 transition-colors ${isSplitView ? "bg-blue-600 text-white border-blue-500" : "bg-slate-700 text-white hover:bg-slate-600"}`}><Columns className="h-4 w-4" /></button>
            <button onClick={onClose} className="flex items-center rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-green-500"><Check className="mr-1 h-3 w-3" /> 完了</button>
          </div>
        </header>

        {/* --- Main View --- */}
        <div className="relative flex flex-1 overflow-hidden bg-slate-100">
            {/* 左側: 参照/監査ペイン */}
            {isSplitView && (
                <div 
                    {...getRefRootProps()}
                    className={`w-1/2 border-r border-slate-300 bg-slate-200 relative flex flex-col transition-colors ${isRefDragActive ? "bg-blue-100 ring-inset ring-4 ring-blue-400" : ""}`}
                >
                    <input {...getRefInputProps()} />
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                        <div className="bg-slate-800/80 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur flex items-center gap-2">
                            <span>{referenceFile ? `Ref: ${referenceFile.name}` : "Comparison: Previous Ver"}</span>
                            {referenceFile && <button onClick={(e) => { e.stopPropagation(); setReferenceFile(null); }} className="hover:text-red-400"><X className="h-3 w-3" /></button>}
                        </div>
                    </div>

                    {comparePreviewUrl ? (
                         <embed src={comparePreviewUrl} type="application/pdf" className="flex-1 w-full h-full" />
                    ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                             <Upload className="h-12 w-12 mb-2 opacity-50" />
                             <p className="font-bold">No previous version</p>
                             <p className="text-xs">Drop a PDF here to compare</p>
                         </div>
                    )}
                    
                    {isRefDragActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm z-20">
                            <p className="text-white font-bold text-xl drop-shadow-md">Drop Reference PDF Here</p>
                        </div>
                    )}
                </div>
            )}

            {/* 右側: 作業ペイン */}
            <div className={`relative flex flex-col ${isSplitView ? "w-1/2" : "w-full"}`}>
                
                {isReordering ? (
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-100">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-700">ページ並べ替え・追加</h3><button onClick={handleSaveReorder} disabled={isLoading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-500 shadow-lg">{isLoading ? "処理中..." : <><FileUp className="h-4 w-4" /> 順序を確定して編集に戻る</>}</button></div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pageOrder.map((pageIndex, i) => (
                                    <div key={pageIndex} draggable onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="aspect-[1/1.4] bg-white rounded-lg border-2 border-slate-300 shadow-sm flex flex-col items-center cursor-move hover:border-blue-400 hover:shadow-md transition-all relative group overflow-hidden"><div className="absolute top-2 left-2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 z-10">{i + 1}</div><div className="w-full h-full p-2 flex items-center justify-center bg-slate-50">{thumbnails[pageIndex] ? <img src={thumbnails[pageIndex]} className="max-h-full max-w-full object-contain pointer-events-none" /> : "Loading..."}</div><Grip className="absolute bottom-2 right-2 h-4 w-4 text-slate-400 z-10" /></div>
                                ))}
                                <div {...getRootProps()} className={`aspect-[1/1.4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "bg-blue-50 border-blue-500" : "bg-slate-100 border-slate-300 hover:bg-white hover:border-blue-400"}`}><input {...getInputProps()} /><Plus className={`h-8 w-8 mb-2 ${isDragActive ? "text-blue-600" : "text-slate-400"}`} /><span className={`text-xs font-bold ${isDragActive ? "text-blue-600" : "text-slate-400"}`}>{isDragActive ? "Drop PDF" : "Add PDF"}</span></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
                        {activeTool !== "none" ? (
                            <div className="relative shadow-2xl bg-white select-none" ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{ cursor: activeTool === "check" ? "copy" : "crosshair" }}>
                                {editPageImage ? <img src={editPageImage} className="max-h-[80vh] w-auto pointer-events-none" /> : <div className="h-[80vh] w-[50vh] flex items-center justify-center"><p>Loading Page...</p></div>}
                                {isDrawing && currentRect && <div className="absolute border-2 border-blue-500 bg-blue-200/30" style={{ left: `${currentRect.x * 100}%`, top: `${currentRect.y * 100}%`, width: `${currentRect.w * 100}%`, height: `${currentRect.h * 100}%` }}></div>}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-xs font-bold pointer-events-none">編集モード: {activeTool.toUpperCase()} (Page 1)</div>
                            </div>
                        ) : (
                            internalPreviewUrl ? <embed key={internalPreviewUrl} src={internalPreviewUrl} type="application/pdf" className="h-full w-full" /> : <div className="opacity-50"><AlertCircle className="h-24 w-24 text-slate-300" /></div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {zoomImage && ( <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-10" onClick={() => setZoomImage(null)}><img src={zoomImage} className="max-h-full max-w-full shadow-2xl rounded" /><button className="absolute top-4 right-4 text-white hover:text-red-400"><X className="h-8 w-8" /></button></div> )}

      {/* --- 履歴パネル --- */}
      <div className={`absolute top-0 right-0 h-full bg-slate-800 border-l border-slate-700 transition-transform duration-300 z-30 w-[320px] flex flex-col shadow-2xl ${isHistoryOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 h-14"><span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Version Control</span><button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button></div>
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute top-0 bottom-0 left-[29px] w-[2px] bg-slate-700 z-0"></div>
          
          {unsavedActions.length > 0 && (
              <div className="relative pl-8 mb-8">
                  <div className="absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 border-yellow-400 bg-yellow-500 z-10 animate-pulse"></div>
                  <div className="text-[10px] text-yellow-400 font-bold mb-1">EDITING (Unsaved)</div>
                  <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
                      {unsavedActions.map((act, i) => <div key={i} className="text-[10px] text-slate-300 border-b border-slate-600/50 last:border-0 py-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-500"></span> {act}</div>)}
                  </div>
              </div>
          )}

          {history.map((h, i) => (
            <div key={i} className={`relative pl-8 mb-6 group ${i === activeVerIdx ? "opacity-100" : "opacity-70 hover:opacity-100"}`}>
              <div onClick={() => setActiveVerIdx(i)} className={`absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 z-10 transition-transform cursor-pointer ${h.isMajor ? "bg-green-500 border-white scale-125" : "bg-slate-500 border-slate-300 group-hover:bg-blue-400"} ${i === activeVerIdx ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800" : ""}`}></div>
              <div className="cursor-pointer" onClick={() => setActiveVerIdx(i)}>
                  <div className="flex justify-between items-center mb-0.5"><span className="text-[10px] text-slate-400 font-mono">{h.date}</span>{h.isMajor && <span className="text-[9px] bg-green-900 text-green-300 px-1.5 rounded border border-green-700">MAJOR</span>}</div>
                  <div className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">{h.ver} {h.action} {h.status === "rejected" && <AlertTriangle className="h-3 w-3 text-red-500" />}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-2"><span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">{h.user.charAt(0)}</span>{h.user}</div>
              </div>
              <div className="text-[10px] text-slate-400 bg-slate-900/50 rounded border border-slate-700 cursor-pointer hover:bg-slate-900 transition-colors" onDoubleClick={() => setExpandedHistoryIdx(expandedHistoryIdx === i ? null : i)}>
                  <div className="p-2 flex justify-between items-center" onClick={() => setExpandedHistoryIdx(expandedHistoryIdx === i ? null : i)}><span>詳細ログ ({h.actionsLog?.length || 0})</span>{expandedHistoryIdx === i ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</div>
                  {expandedHistoryIdx === i && (
                      <div className="px-2 pb-2 border-t border-slate-700 pt-1">
                          {h.actionsLog && h.actionsLog.length > 0 ? h.actionsLog.map((log, idx) => <div key={idx} className="py-0.5 flex items-center gap-1.5 text-slate-500"><span className="w-1 h-1 bg-slate-600 rounded-full"></span>{log}</div>) : <div className="text-slate-600 italic">操作履歴なし</div>}
                      </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}