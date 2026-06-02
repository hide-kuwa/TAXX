"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Link2 } from "lucide-react";
import { API_BASE } from "@/config/api";
import { APP_ROLES, STAKEHOLDER_MASTER } from "@/config/organization";
import { loadCurrentUser } from "@/lib/auth";
import { buildAuthHeaders } from "@/lib/api-auth";
import { AuditSplitPane } from "./components/AuditSplitPane";
import { HistoryPanel } from "./components/HistoryPanel";
import { MainCanvas } from "./components/MainCanvas";
import { ViewerHeader } from "./components/ViewerHeader";
import { useAuditWorkflow, type WorkflowEventInput } from "./hooks/useAuditWorkflow";
import { usePageViewAudit } from "./hooks/usePageViewAudit";
import { useFileBlobUrl } from "./hooks/useFileBlobUrl";
import { usePdfEditor } from "./hooks/usePdfEditor";
import {
  createDocumentVersionSnapshot,
  fetchDocumentVersionFile,
  listDocumentVersions,
  versionSourceLabel,
  type DocumentVersionItem,
  type VersionBump,
} from "./lib/document-versions";
import {
  createReviewEvent,
  listReviewEvents,
  type ReviewEventItem,
} from "./lib/review-events";
import {
  AuditCheckLink,
  AuditCheckPoint,
  EnhancedDocVersion,
  ViewerMode,
  ViewerModalProps,
  WorkflowStatus,
} from "./types";

const resolveActorName = (stakeholderId: string | null, email: string | null): string => {
  if (stakeholderId) {
    const match = STAKEHOLDER_MASTER.find((item) => item.id === stakeholderId);
    if (match) return match.displayName;
  }
  return email || stakeholderId || "操作者";
};

const formatEventDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sha256OfFile = async (target: File | null): Promise<string | undefined> => {
  if (!target) return undefined;
  const buffer = await target.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const reviewEventToVersion = (event: ReviewEventItem): EnhancedDocVersion => ({
  ver: event.version_label || "v1.0.0",
  date: formatEventDate(event.created_at),
  user: resolveActorName(event.actor_stakeholder_id, event.actor_email),
  action: event.action_title || event.event_type,
  status: (event.status as WorkflowStatus) || "draft",
  actionsLog: event.reason ? [event.reason] : [],
  isMajor: event.is_major,
  versionId: event.document_version_id || event.id,
});

const buildHistoryFromVersions = (
  versions: DocumentVersionItem[],
  events: ReviewEventItem[],
): EnhancedDocVersion[] =>
  versions.map((v) => {
    const ev = events.find((e) => e.document_version_id === v.id);
    return {
      ver: v.version_label,
      date: formatEventDate(v.created_at),
      user: resolveActorName(v.created_by_stakeholder_id, v.created_by_email),
      action: ev?.action_title || versionSourceLabel(v.source),
      status: (ev?.status as WorkflowStatus) || "draft",
      actionsLog: ev?.reason ? [ev.reason] : [],
      isMajor: ev?.is_major ?? /\.0\.0$/.test(v.version_label),
      versionId: v.id,
    };
  });

const WORKFLOW_BUMP: Partial<Record<string, VersionBump>> = {
  work_save: "minor",
  audit_start: "audit_start",
  approve: "major",
};

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
  viewerSession = 0,
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
  syncWithDocugrid = false,
  viewerMode = "preview",
  onViewerModeChange,
  slotIdentity,
  slotLabel,
  onVersionCreated,
  onAuditStateChange,
}: ViewerModalProps) {
  const [currentUser, setCurrentUser] = useState("demo-user");
  const [persistedHistory, setPersistedHistory] = useState<EnhancedDocVersion[] | null>(null);
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [pendingCheckPoint, setPendingCheckPoint] = useState<AuditCheckPoint | null>(null);
  const [auditCheckLinks, setAuditCheckLinks] = useState<AuditCheckLink[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const isReadOnly = viewerMode === "preview";

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !slotIdentity) return;
    const openType = viewerMode === "edit" ? "viewer_open_edit" : "viewer_open_preview";
    const openTitle = viewerMode === "edit" ? "編集ビューアを開く" : "プレビューを開く";
    void createReviewEvent(slotIdentity, {
      event_type: openType,
      status: "draft",
      action_title: openTitle,
    }).catch((err) => console.warn("viewer_open audit failed:", err));

    return () => {
      void createReviewEvent(slotIdentity, {
        event_type: "viewer_close",
        status: "draft",
        action_title: "ビューアを閉じる",
      }).catch((err) => console.warn("viewer_close audit failed:", err));
    };
  }, [isOpen, slotIdentity, viewerMode]);

  const actorLabel = useMemo(() => {
    const u = loadCurrentUser();
    if (!u) return "操作者";
    const roleLabel = APP_ROLES.find((r) => r.id === u.appRoleId)?.label;
    return roleLabel ? `${u.name} (${roleLabel})` : u.name;
  }, []);

  const handleWorkflowEvent = useCallback(
    async (event: WorkflowEventInput) => {
      if (!slotIdentity) return;
      try {
        const sha = await sha256OfFile(file);
        let documentVersionId: string | undefined;
        let logicalDocumentId: string | undefined;
        let versionLabel = event.versionLabel;

        const bump = WORKFLOW_BUMP[event.eventType];
        if (bump && file) {
          const snap = await createDocumentVersionSnapshot(
            slotIdentity,
            file,
            bump,
            slotLabel,
          );
          documentVersionId = snap.id;
          logicalDocumentId = snap.logical_document_id;
          versionLabel = snap.version_label;
          onVersionCreated?.({
            versionId: snap.id,
            versionLabel: snap.version_label,
            logicalDocumentId: snap.logical_document_id,
            workflowStatus: event.status,
            file,
          });
        }

        await createReviewEvent(slotIdentity, {
          event_type: event.eventType,
          status: event.status,
          action_title: event.actionTitle,
          version_label: versionLabel,
          reason: event.reason,
          content_sha256: sha,
          is_major: event.isMajor,
          logical_document_id: logicalDocumentId,
          document_version_id: documentVersionId,
        });

        const [events, versions] = await Promise.all([
          listReviewEvents(slotIdentity),
          listDocumentVersions(slotIdentity),
        ]);
        if (versions.length > 0) {
          setPersistedHistory(buildHistoryFromVersions(versions, events));
        } else if (events.length > 0) {
          setPersistedHistory(events.map(reviewEventToVersion));
        }
        onAuditStateChange?.();
      } catch (err) {
        console.warn("Failed to persist review event:", err);
      }
    },
    [slotIdentity, file, slotLabel, onVersionCreated, onAuditStateChange],
  );

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
    actorLabel,
    initialHistory: persistedHistory,
    onEvent: handleWorkflowEvent,
  });

  const activeFile = activeVerIdx === 0 ? file : historyFile ?? file;
  const localBlobUrl = useFileBlobUrl(activeFile, viewerSession, isOpen);
  const previewUrl = localBlobUrl ?? pdfUrl;

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
    pendingOverlay,
    isDrawing,
    currentRect,
    canvasRef,
    getRootProps,
    getInputProps,
    isDragActive,
    handleSaveReorder,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleDragStart,
    handleDragOverSlot,
    handleDropSlot,
    handleDragEnd,
  } = usePdfEditor({
    file: activeFile,
    pdfUrl: previewUrl,
    viewerSession,
    editorKey,
    pageCount,
    onHighlight,
    onReorder,
    onMerge,
    onGetThumbnails,
    onRenderPage,
    recordAction,
    syncWithDocugrid,
  });

  const activeVersionId = history[activeVerIdx]?.versionId;
  const activeVersionLabel = history[activeVerIdx]?.ver;

  usePageViewAudit({
    enabled: isOpen && !!slotIdentity,
    slotIdentity,
    currentPage,
    documentVersionId: activeVersionId !== "fallback" ? activeVersionId : undefined,
    versionLabel: activeVersionLabel !== "---" ? activeVersionLabel : undefined,
  });

  useEffect(() => {
    const user = loadCurrentUser();
    if (user?.email) {
      setCurrentUser(user.email);
    }
  }, []);

  // 開いたスロットの版一覧＋監査タイムラインをサーバーから復元
  useEffect(() => {
    if (!isOpen || !slotIdentity) {
      setPersistedHistory(null);
      return;
    }
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const [events, versions] = await Promise.all([
          listReviewEvents(slotIdentity, controller.signal),
          listDocumentVersions(slotIdentity, controller.signal),
        ]);
        if (!active) return;
        if (versions.length > 0) {
          setPersistedHistory(buildHistoryFromVersions(versions, events));
        } else if (events.length > 0) {
          setPersistedHistory(events.map(reviewEventToVersion));
        } else {
          setPersistedHistory(null);
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.warn("Failed to load version history:", err);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen, slotIdentity]);

  // 履歴パネルで旧版を選択したとき immutable PDF を取得
  useEffect(() => {
    if (!isOpen || activeVerIdx === 0) {
      setHistoryFile(null);
      setHistoryLoadError(null);
      return;
    }
    const ver = history[activeVerIdx];
    if (!ver?.versionId || ver.versionId === "initial" || ver.versionId === "fallback") return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        setHistoryLoadError(null);
        const loaded = await fetchDocumentVersionFile(
          ver.versionId,
          file?.name || "document.pdf",
          controller.signal,
        );
        if (active) setHistoryFile(loaded);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError" && active) {
          setHistoryLoadError("旧版の読み込みに失敗しました");
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen, activeVerIdx, history, file?.name]);

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
      if (slotIdentity && auditCheckLinks.length > 0) {
        await createReviewEvent(slotIdentity, {
          event_type: "audit_link_create",
          status: currentStatus,
          action_title: "監査リンクを保存",
          document_version_id:
            activeVersion.versionId !== "fallback" ? activeVersion.versionId : undefined,
          version_label: activeVersion.ver !== "---" ? activeVersion.ver : undefined,
          detail: JSON.stringify({ count: auditCheckLinks.length, versionId: activeVersion.versionId }),
        });
      }
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

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex select-none overflow-hidden bg-slate-950">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col animate-fade-in-up transition-all duration-300">
        <ViewerHeader
          fileName={activeFile ? activeFile.name : "Document"}
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
          canAnnotate={canAnnotate && !isReadOnly}
          canApprove={canApprove}
          viewerMode={viewerMode}
          onStartEdit={() => onViewerModeChange?.("edit")}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-100">
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
              file={activeFile}
              pdfUrl={previewUrl}
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
              pendingOverlay={pendingOverlay}
              canvasRef={canvasRef}
              handlePointerDown={handlePointerDown}
              handlePointerMove={handlePointerMove}
              handlePointerUp={handlePointerUp}
              handlePointerCancel={handlePointerCancel}
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
    </div>,
    document.body,
  );
}
