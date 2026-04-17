"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Link2 } from "lucide-react";
import { API_BASE } from "@/config/api";
import { loadCurrentUser } from "@/lib/auth";
import { buildAuthHeaders } from "@/lib/api-auth";
import { AuditSplitPane } from "./components/AuditSplitPane";
import { HistoryPanel } from "./components/HistoryPanel";
import { MainCanvas } from "./components/MainCanvas";
import { ViewerHeader } from "./components/ViewerHeader";
import { useAuditWorkflow } from "./hooks/useAuditWorkflow";
import { usePdfEditor } from "./hooks/usePdfEditor";
import { AuditCheckLink, AuditCheckPoint, EnhancedDocVersion, ViewerModalProps } from "./types";

const fallbackActiveVersion: EnhancedDocVersion = {
  ver: "---",
  date: "",
  user: "",
  action: "",
  status: "draft",
  actionsLog: [],
  isMajor: false,
  versionId: "fallback",
};

export default function ViewerModal({
  isOpen,
  onClose,
  file,
  pdfUrl,
  pageCount,
  uploadStatus,
  isLoading,
  onHighlight,
  onReorder,
  onMerge,
  onGetThumbnails,
  onRenderPage,
  canAnnotate = true,
  canApprove = true,
}: ViewerModalProps) {
  const [currentUser, setCurrentUser] = useState("demo-user");
  const [isSplitView, setIsSplitView] = useState(false);
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [pendingCheckPoint, setPendingCheckPoint] = useState<AuditCheckPoint | null>(null);
  const [auditCheckLinks, setAuditCheckLinks] = useState<AuditCheckLink[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const {
    history,
    activeVerIdx,
    setActiveVerIdx,
    actionsLog,
    currentStatus,
    expandedHistoryIdx,
    setExpandedHistoryIdx,
    isHistoryOpen,
    setIsHistoryOpen,
    recordAction,
    handleWorkSave,
    handleRequestReview,
    handleStartAudit,
    handleAuditSuspend,
    handleRemand,
    handleApprove,
  } = useAuditWorkflow({
    file,
    pdfUrl,
    isOpen,
    onAuditStart: () => setIsSplitView(true),
    onAuditEnd: () => setIsSplitView(false),
  });

  const editorKey = history[activeVerIdx]?.versionId ?? "initial";

  const {
    isReordering,
    setIsReordering,
    pageOrder,
    selectedSlots,
    toggleSlotSelection,
    clearSlotSelection,
    removeSelectedSlots,
    keepOnlySelectedSlots,
    canUndo,
    canRedo,
    undoPageOrder,
    redoPageOrder,
    currentPage,
    pageCountSafe,
    canGoPrev,
    canGoNext,
    goPrevPage,
    goNextPage,
    thumbnails,
    activeTool,
    setActiveTool,
    editPageImage,
    isDrawing,
    currentRect,
    canvasRef,
    getRootProps,
    getInputProps,
    isDragActive,
    handleSaveReorder,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragStart,
    handleDragOverSlot,
    handleDropSlot,
    handleDragEnd,
  } = usePdfEditor({
    file,
    pdfUrl,
    editorKey,
    pageCount,
    onHighlight,
    onReorder,
    onMerge,
    onGetThumbnails,
    onRenderPage,
    recordAction,
  });

  useEffect(() => {
    const user = loadCurrentUser();
    if (user?.email) {
      setCurrentUser(user.email);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsSplitView(false);
      setLeftFile(file);
      setRightFile(null);
      setPendingCheckPoint(null);
      setAuditCheckLinks([]);
    }
  }, [isOpen, file]);

  useEffect(() => {
    if (currentStatus === "auditing") {
      setIsSplitView(true);
    }
  }, [currentStatus]);

  const handleSwapSplitSources = () => {
    setLeftFile(rightFile);
    setRightFile(leftFile);
  };

  const hashFile = async (target: File | null): Promise<string | undefined> => {
    if (!target) return undefined;
    const buffer = await target.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleSplitCheckPoint = async (side: "left" | "right", point: Omit<AuditCheckPoint, "side">) => {
    const sideFile = side === "left" ? leftFile : rightFile;
    const nextPoint: AuditCheckPoint = {
      side,
      ...point,
      fileHash: await hashFile(sideFile),
    };
    if (!pendingCheckPoint || pendingCheckPoint.side === side) {
      setPendingCheckPoint(nextPoint);
      return;
    }
    const left = pendingCheckPoint.side === "left" ? pendingCheckPoint : nextPoint;
    const right = pendingCheckPoint.side === "right" ? pendingCheckPoint : nextPoint;
    const link: AuditCheckLink = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
      left,
      right,
    };
    setAuditCheckLinks((prev) => [link, ...prev]);
    setPendingCheckPoint(null);
  };

  const leftMarkers = auditCheckLinks.flatMap((link) => [link.left]);
  const rightMarkers = auditCheckLinks.flatMap((link) => [link.right]);
  const activeVersion = history[activeVerIdx] || fallbackActiveVersion;
  const auditLinksEndpoint = `${API_BASE}/audit-links/${encodeURIComponent(activeVersion.versionId)}`;

  useEffect(() => {
    let mounted = true;
    const loadAuditLinks = async () => {
      if (!isOpen) return;
      setIsLoadingLinks(true);
      try {
        const res = await fetch(auditLinksEndpoint, { headers: buildAuthHeaders() });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as AuditCheckLink[];
        if (mounted) {
          setAuditCheckLinks(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setAuditCheckLinks([]);
        }
      } finally {
        if (mounted) setIsLoadingLinks(false);
      }
    };
    void loadAuditLinks();
    return () => {
      mounted = false;
    };
  }, [auditLinksEndpoint, isOpen]);

  const handleSaveAuditLinks = async () => {
    setIsSavingLinks(true);
    try {
      const res = await fetch(auditLinksEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify(auditCheckLinks),
      });
      if (!res.ok) throw new Error("save failed");
      alert("監査リンクを保存しました。");
    } catch {
      alert("監査リンク保存に失敗しました。");
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleExportAuditLinks = () => {
    const payload = {
      versionId: activeVersion.versionId,
      exportedAt: new Date().toISOString(),
      links: auditCheckLinks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-links-${activeVersion.versionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none overflow-hidden">
      <div className="relative flex h-full flex-1 flex-col transition-all duration-300">
        <ViewerHeader
          fileName={file ? file.name : "Document"}
          activeVersion={activeVersion}
          unsavedCount={actionsLog.length}
          isReordering={isReordering}
          activeTool={activeTool}
          isLoading={isLoading}
          isHistoryOpen={isHistoryOpen}
          isSplitView={isSplitView}
          onClose={onClose}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          onToggleSplitView={() => setIsSplitView(!isSplitView)}
          isAuditLocked={currentStatus === "auditing"}
          setActiveTool={setActiveTool}
          setIsReordering={setIsReordering}
          handleWorkSave={handleWorkSave}
          handleRequestReview={handleRequestReview}
          handleStartAudit={handleStartAudit}
          handleAuditSuspend={handleAuditSuspend}
          handleRemand={handleRemand}
          handleApprove={handleApprove}
          canAnnotate={canAnnotate}
          canApprove={canApprove}
        />

        <div className="relative flex flex-1 overflow-hidden bg-slate-100">
          {isSplitView ? (
            <>
              <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg border border-slate-300 bg-white/95 px-2 py-1 shadow">
                <button
                  type="button"
                  onClick={handleSwapSplitSources}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  左右入替
                </button>
                <div className="text-xs text-slate-500">
                  {pendingCheckPoint
                    ? `対応待ち: ${pendingCheckPoint.side.toUpperCase()} P${pendingCheckPoint.page + 1}`
                    : "対応点リンク待機中"}
                </div>
              </div>
              <AuditSplitPane
                side="left"
                title="Left Reference"
                file={leftFile}
                workingFile={file}
                onFileChange={setLeftFile}
                onRenderPage={onRenderPage}
                markers={leftMarkers}
                onCheckPoint={handleSplitCheckPoint}
                activeTool={activeTool}
              />
              <AuditSplitPane
                side="right"
                title="Right Reference"
                file={rightFile}
                workingFile={file}
                onFileChange={setRightFile}
                onRenderPage={onRenderPage}
                markers={rightMarkers}
                onCheckPoint={handleSplitCheckPoint}
                activeTool={activeTool}
              />
              <div className="absolute bottom-3 left-3 z-20 w-[460px] rounded-lg border border-slate-300 bg-white/95 p-2 shadow">
                <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Link2 className="h-3.5 w-3.5" />
                  監査対応リンク ({auditCheckLinks.length})
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAuditLinks}
                    disabled={isSavingLinks}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {isSavingLinks ? "保存中..." : "リンク保存"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAuditLinks}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    JSON出力
                  </button>
                  {isLoadingLinks && <span className="text-[10px] text-slate-500">読み込み中...</span>}
                </div>
                <div className="max-h-28 space-y-1 overflow-auto text-[11px] text-slate-600">
                  {auditCheckLinks.length === 0 ? (
                    <div>チェックツールで左右1点ずつクリックするとリンクが作成されます。</div>
                  ) : (
                    auditCheckLinks.slice(0, 12).map((link) => (
                      <div key={link.id} className="rounded bg-slate-100 px-2 py-1">
                        L:P{link.left.page + 1} ({link.left.x.toFixed(2)}, {link.left.y.toFixed(2)}) {"->"} R:P
                        {link.right.page + 1} ({link.right.x.toFixed(2)}, {link.right.y.toFixed(2)})
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <MainCanvas
              isSplitView={isSplitView}
              isReordering={isReordering}
              isLoading={isLoading}
              pageOrder={pageOrder}
              selectedSlots={selectedSlots}
              toggleSlotSelection={toggleSlotSelection}
              clearSlotSelection={clearSlotSelection}
              removeSelectedSlots={removeSelectedSlots}
              keepOnlySelectedSlots={keepOnlySelectedSlots}
              canUndo={canUndo}
              canRedo={canRedo}
              undoPageOrder={undoPageOrder}
              redoPageOrder={redoPageOrder}
              currentPage={currentPage}
              pageCountSafe={pageCountSafe}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              goPrevPage={goPrevPage}
              goNextPage={goNextPage}
              thumbnails={thumbnails}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              handleSaveReorder={handleSaveReorder}
              handleDragStart={handleDragStart}
              handleDragOverSlot={handleDragOverSlot}
              handleDropSlot={handleDropSlot}
              handleDragEnd={handleDragEnd}
              activeTool={activeTool}
              editPageImage={editPageImage}
              canvasRef={canvasRef}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              isDrawing={isDrawing}
              currentRect={currentRect}
            />
          )}
        </div>
      </div>

      <HistoryPanel
        isHistoryOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        activeVerIdx={activeVerIdx}
        setActiveVerIdx={setActiveVerIdx}
        unsavedActions={actionsLog}
        expandedHistoryIdx={expandedHistoryIdx}
        setExpandedHistoryIdx={setExpandedHistoryIdx}
      />
    </div>
  );
}
