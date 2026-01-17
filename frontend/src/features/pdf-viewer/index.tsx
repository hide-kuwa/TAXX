"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AuditSplitPane } from "./components/AuditSplitPane";
import { HistoryPanel } from "./components/HistoryPanel";
import { MainCanvas } from "./components/MainCanvas";
import { ServerFilePanel } from "./components/ServerFilePanel";
import { ViewerHeader } from "./components/ViewerHeader";
import { useAuditWorkflow } from "./hooks/useAuditWorkflow";
import { usePdfEditor } from "./hooks/usePdfEditor";
import { EnhancedDocVersion, ViewerModalProps } from "./types";

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
}: ViewerModalProps) {
  const [isSplitView, setIsSplitView] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [comparePreviewUrl, setComparePreviewUrl] = useState<string | null>(null);
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);

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
    thumbnails,
    zoomImage,
    setZoomImage,
    activeTool,
    setActiveTool,
    editPageImage,
    referencePageImage,
    isDrawing,
    currentRect,
    canvasRef,
    referenceCanvasRef,
    getRootProps,
    getInputProps,
    isDragActive,
    handleSaveReorder,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
  } = usePdfEditor({
    file,
    pdfUrl,
    editorKey,
    isOpen,
    pageCount,
    referenceFile,
    onReferenceFileUpdate: (updated) => setReferenceFile(updated),
    onHighlight,
    onReorder,
    onMerge,
    onGetThumbnails,
    onRenderPage,
    recordAction,
  });

  useEffect(() => {
    if (isOpen && file && pdfUrl) {
      setInternalPreviewUrl(pdfUrl);
    }
  }, [file, pdfUrl, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsSplitView(false);
      setReferenceFile(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStatus === "auditing") {
      setIsSplitView(true);
    }
  }, [currentStatus]);

  useEffect(() => {
    const targetVer = history[activeVerIdx];
    if (targetVer && targetVer.file) {
      const objectUrl = URL.createObjectURL(targetVer.file);
      setInternalPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setInternalPreviewUrl(null);
  }, [activeVerIdx, history]);

  useEffect(() => {
    if (isSplitView) {
      let targetFile: File | null = null;
      if (referenceFile) {
        targetFile = referenceFile;
      } else {
        const compareIdx = Math.min(activeVerIdx + 1, history.length - 1);
        const compareVer = history[compareIdx];
        if (compareVer) targetFile = compareVer.file ?? null;
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

  if (!isOpen) return null;

  const activeVersion = history[activeVerIdx] || fallbackActiveVersion;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none overflow-hidden">
      <div
        className="relative flex h-full flex-1 flex-col transition-all duration-300"
        style={{ marginRight: isHistoryOpen ? "320px" : "0" }}
      >
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
        />

        <div className="relative flex flex-1 overflow-hidden bg-slate-100">
          {isSplitView &&
            (referenceFile ? (
              <AuditSplitPane
                referenceFile={referenceFile}
                setReferenceFile={setReferenceFile}
                comparePreviewUrl={comparePreviewUrl}
                referencePageImage={referencePageImage}
                activeTool={activeTool}
                referenceCanvasRef={referenceCanvasRef}
                onReferenceMouseDown={handleMouseDown("reference")}
                onReferenceMouseMove={handleMouseMove("reference")}
                onReferenceMouseUp={handleMouseUp("reference")}
              />
            ) : (
              <ServerFilePanel onFileSelect={setReferenceFile} />
            ))}
          <MainCanvas
            isSplitView={isSplitView}
            isReordering={isReordering}
            isLoading={isLoading}
            pageOrder={pageOrder}
            thumbnails={thumbnails}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            handleSaveReorder={handleSaveReorder}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragEnd={handleDragEnd}
            activeTool={activeTool}
            editPageImage={editPageImage}
            canvasRef={canvasRef}
            handleMouseDown={handleMouseDown("primary")}
            handleMouseMove={handleMouseMove("primary")}
            handleMouseUp={handleMouseUp("primary")}
            isDrawing={isDrawing}
            currentRect={currentRect}
            internalPreviewUrl={internalPreviewUrl}
          />
        </div>
      </div>

      {zoomImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-10"
          onClick={() => setZoomImage(null)}
        >
          <img src={zoomImage} className="max-h-full max-w-full shadow-2xl rounded" />
          <button className="absolute top-4 right-4 text-white hover:text-red-400">
            <X className="h-8 w-8" />
          </button>
        </div>
      )}

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
