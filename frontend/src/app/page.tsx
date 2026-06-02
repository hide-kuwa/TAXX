"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadStatus } from "@/features/pdf-viewer/types";
import { useViewerUiStore } from "@/features/pdf-viewer/state/viewer-ui-store";
import { buildStaffData } from "@/components/mockData";
import { useOrgDirectory } from "@/features/org/useOrgDirectory";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import MatrixGrid from "@/components/MatrixGrid";
import ViewerModal from "@/features/pdf-viewer";
import { API_BASE, API_ENDPOINTS } from "@/config/api";
import { checkSession, clearAuthSession, loadCurrentUser } from "@/lib/auth";
import { buildAuthHeaders, setClientScope } from "@/lib/api-auth";
import { canAccessClient, hasPermission, resolveStakeholder } from "@/lib/authorization";
import { hydrateDocugridForSlot } from "@/features/docugrid/lib/hydrate-docugrid-slot";
import { parseSlotKey } from "@/features/docugrid/lib/slot-scope";
import { useDocugridAutoSync } from "@/features/docugrid/hooks/useDocugridAutoSync";
import { useSyncDocugrid } from "@/features/docugrid/hooks/useSyncDocugrid";
import { useDocugridStore } from "@/features/docugrid/state/docugrid-store";
import {
  fetchSlotDocumentFile,
  listSlotDocuments,
  persistSlotDocument,
} from "@/features/docugrid/lib/slot-documents";
import { createReviewEvent, listReviewTimeline, type ReviewTimelineItem } from "@/features/pdf-viewer/lib/review-events";
import { createDocumentVersionSnapshot } from "@/features/pdf-viewer/lib/document-versions";
import {
  classifyDocument,
  type ClassifyRankedItem,
} from "@/features/docugrid/lib/classify";
import {
  fetchDocumentStatus,
  type DocumentStatusSummary,
} from "@/features/docugrid/lib/document-status";
import {
  loadAllSlotLayouts,
  persistSlotLayout,
  resolveSlotLayout,
  type SlotLayout,
} from "@/lib/slot-layout-storage";

type PendingReview = {
  id: string;
  file: File;
  fileName: string;
  confidence: number;
  engine: string;
  suggestedIndex: number | null;
  ranked: ClassifyRankedItem[];
};

const AUTO_SORT_THRESHOLD = 0.6;

type SlotDoc = {
  file: File;
  pageCount: number | null;
  docId?: string;
  persisted?: boolean;
  logicalDocumentId?: string;
  currentVersionId?: string;
  currentVersionLabel?: string;
  workflowStatus?: string;
  logicalStatus?: string;
  docugridDocumentId?: string;
};

export default function DocuGridPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof loadCurrentUser>>(null);
  const [activeStaffIdx, setActiveStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"year" | "month">("year");
  const [activePeriodIdx, setActivePeriodIdx] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewerSession, setViewerSession] = useState(0);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const isViewerOpen = useViewerUiStore((s) => s.isOpen);
  const viewerMode = useViewerUiStore((s) => s.mode);
  const viewerSourceFile = useViewerUiStore((s) => s.sourceFile);
  const fileRef = useRef<File | null>(null);
  const [slotDocs, setSlotDocs] = useState<Record<string, SlotDoc>>({});
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [isHydratingSlots, setIsHydratingSlots] = useState(false);
  const [pendingReview, setPendingReview] = useState<PendingReview[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [docStatus, setDocStatus] = useState<DocumentStatusSummary | null>(null);
  const [statusNonce, setStatusNonce] = useState(0);
  const [timelineEvents, setTimelineEvents] = useState<ReviewTimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const annotationSnapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAnnotationSnapshotRef = useRef<(file: File) => void>(() => {});

  const { clients: orgClients, groups: orgGroups } = useOrgDirectory();
  const staffData = useMemo(
    () => buildStaffData(orgClients, orgGroups),
    [orgClients, orgGroups],
  );
  const currentStaff = staffData[activeStaffIdx] ?? staffData[0];
  const stakeholder = resolveStakeholder(currentUser);
  const scopedClients = currentStaff.clients.filter((client) => canAccessClient(stakeholder, client.id));
  const effectiveStaff = { ...currentStaff, clients: scopedClients };
  const currentClient = effectiveStaff.clients[activeClientIdx] || {
    fiscal: 3, name: "Unknown", role: "main", id: "unknown",
  };
  const canViewDocument = hasPermission(currentUser, "document.view");
  const canUploadDocument = hasPermission(currentUser, "document.upload");
  const canAnnotateDocument = hasPermission(currentUser, "document.annotate");
  const canApproveAudit = hasPermission(currentUser, "audit.approve");
  const currentGroups = currentClient.groupLabels ?? [];
  const relatedClients = effectiveStaff.clients
    .filter((client) => {
      if (client.id === currentClient.id) return false;
      if (!client.groupLabels?.length || currentGroups.length === 0) return false;
      return client.groupLabels.some((group) => currentGroups.includes(group));
    })
    .map((client) => ({
      id: client.id,
      name: client.name,
      relation: Array.from(new Set(client.relationLabels ?? [])).join(" / "),
    }));

  const assignPreviewFromFile = useCallback((source: File) => {
    const next = URL.createObjectURL(source);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
  }, []);

  const docugridPageCount = useDocugridStore((s) => s.pageOrder.length);
  const { loadFromCloud } = useSyncDocugrid();

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const user = loadCurrentUser();
      const status = await checkSession();
      if (!active) return;

      if (status === "missing") {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      if (status === "invalid") {
        clearAuthSession();
        router.replace("/login?reason=session");
        return;
      }
      if (status === "offline") {
        clearAuthSession();
        router.replace("/login?reason=offline");
        return;
      }
      if (user) setCurrentUser(user);
      setAuthChecked(true);
    };
    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!isViewerOpen || !viewerSourceFile) return;
    fileRef.current = viewerSourceFile;
    setFile(viewerSourceFile);
    assignPreviewFromFile(viewerSourceFile);
  }, [isViewerOpen, viewerSourceFile, assignPreviewFromFile]);

  useEffect(() => {
    if (!file && isViewerOpen) {
      useViewerUiStore.getState().close();
    }
  }, [file, isViewerOpen]);

  useEffect(() => {
    if (isViewerOpen && file && !pdfUrl) {
      assignPreviewFromFile(file);
    }
  }, [isViewerOpen, file, pdfUrl, assignPreviewFromFile]);

  useEffect(() => {
    if (!activeSlotKey || !file) return;
    setSlotDocs((prev) => {
      const cur = prev[activeSlotKey];
      if (cur && cur.file === file) return prev;
      return {
        ...prev,
        [activeSlotKey]: { ...cur, file, pageCount: cur?.pageCount ?? pageCount },
      };
    });
  }, [file, activeSlotKey, pageCount]);

  useEffect(() => {
    if (activeClientIdx >= effectiveStaff.clients.length) {
      setActiveClientIdx(0);
    }
  }, [activeClientIdx, effectiveStaff.clients.length]);

  useEffect(() => {
    if (currentClient?.id && currentClient.id !== "unknown") {
      setClientScope(currentClient.id);
    }
  }, [currentClient?.id]);

  const onStaffChange = (direction: 1 | -1) => {
    setActiveStaffIdx((prev) => {
      let next = prev + direction;
      if (next >= staffData.length) next = 0;
      if (next < 0) next = staffData.length - 1;
      return next;
    });
    setActiveClientIdx(0);
  };

  const onSelectRelatedClient = (clientId: string) => {
    const nextIdx = effectiveStaff.clients.findIndex((client) => client.id === clientId);
    if (nextIdx >= 0) {
      setActiveClientIdx(nextIdx);
    }
  };

  const uploadFile = useCallback(
    async (selectedFile: File): Promise<{ ok: boolean; pageCount: number | null }> => {
      if (!canUploadDocument) {
        alert("アップロード権限がありません。");
        return { ok: false, pageCount: null };
      }
      setUploadStatus("uploading");
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          body: formData,
          headers: buildAuthHeaders(),
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        const count = data.page_count ?? data.pageCount;
        const n = typeof count === "number" ? count : null;
        setUploadStatus("success");
        return { ok: true, pageCount: n };
      } catch (error) {
        console.error("Upload Error:", error);
        setUploadStatus("error");
        return { ok: false, pageCount: null };
      } finally {
        setIsLoading(false);
      }
    },
    [canUploadDocument],
  );

  const periodKey =
    activePeriodIdx === 0 ? "perm" : `${activeMode}:${activePeriodIdx}`;

  const defaultSlotLabels = useMemo(() => {
    if (activePeriodIdx === 0) return ["定款", "履歴事項全部証明書", "株主名簿", "設立届出書"];
    if (activeMode === "year") return ["決算報告書", "総勘定元帳", "法人税申告書", "消費税申告書"];
    return ["月次試算表", "通帳コピー", "請求書綴り", "給与台帳"];
  }, [activePeriodIdx, activeMode]);

  const slotLayoutKey = `${currentClient.id}:${periodKey}`;
  const [slotLayoutStore, setSlotLayoutStore] = useState<Record<string, SlotLayout>>(() =>
    typeof window !== "undefined" ? loadAllSlotLayouts() : {},
  );

  const { labels: slotLabels, order: slotDisplayOrder } = useMemo(
    () => resolveSlotLayout(slotLayoutKey, defaultSlotLabels, slotLayoutStore),
    [slotLayoutKey, defaultSlotLabels, slotLayoutStore],
  );

  const slotKeyFor = useCallback(
    (slotIndex: number) => `${currentClient.id}:${periodKey}:${slotIndex}`,
    [currentClient.id, periodKey],
  );

  const applySlotLayout = useCallback(
    (layout: SlotLayout) => {
      setSlotLayoutStore((prev) => ({ ...prev, [slotLayoutKey]: layout }));
      persistSlotLayout(slotLayoutKey, layout);
    },
    [slotLayoutKey],
  );

  const handleClearSlot = useCallback(
    (slotIndex: number) => {
      const key = slotKeyFor(slotIndex);
      setSlotDocs((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSlotNotice(`「${slotLabels[slotIndex] ?? "枠"}」から資料を外しました。`);
    },
    [slotKeyFor, slotLabels],
  );

  const onDocugridSaved = useCallback(
    (documentId: string) => {
      if (!activeSlotKey) return;
      setSlotDocs((prev) => {
        const cur = prev[activeSlotKey];
        if (!cur) return prev;
        return {
          ...prev,
          [activeSlotKey]: { ...cur, docugridDocumentId: documentId },
        };
      });
    },
    [activeSlotKey],
  );

  const activeDocugridScope = useMemo(() => {
    if (!activeSlotKey) return null;
    return parseSlotKey(activeSlotKey);
  }, [activeSlotKey]);

  const { saveNow: saveDocugridNow } = useDocugridAutoSync(activeDocugridScope, {
    enabled: canAnnotateDocument,
    onSaved: onDocugridSaved,
  });

  const activateDoc = useCallback(
    async (
      targetFile: File,
      count: number | null,
      slotKey: string,
      docugridDocumentId?: string,
    ) => {
      await hydrateDocugridForSlot(targetFile, count, loadFromCloud, docugridDocumentId);
      setActiveSlotKey(slotKey);
      setFile(targetFile);
      setPageCount(count);
      assignPreviewFromFile(targetFile);
      setViewerSession((s) => s + 1);
    },
    [assignPreviewFromFile, loadFromCloud],
  );

  // 顧客/期が変わったら Docugrid セッションをリセット
  useEffect(() => {
    useDocugridStore.getState().resetDocugrid();
    setActiveSlotKey(null);
  }, [currentClient.id, periodKey]);

  /** 1ファイルをスロットへ永続化（失敗時はローカルfallback）。activate=true で編集対象として開く。 */
  const persistFileToSlot = useCallback(
    async (
      selectedFile: File,
      slotIndex: number,
      slotLabel: string,
      activate: boolean,
    ): Promise<{ persisted: boolean }> => {
      const slotKey = slotKeyFor(slotIndex);
      const replacing = !!slotDocs[slotKey]?.docId;
      if (replacing) {
        setSlotDocs((prev) => ({
          ...prev,
          [slotKey]: {
            ...prev[slotKey],
            logicalStatus: "processing",
          },
        }));
      }
      try {
        const item = await persistSlotDocument({
          clientId: currentClient.id,
          periodKey,
          slotId: String(slotIndex),
          slotLabel,
          file: selectedFile,
        });
        const n = item.page_count ?? null;
        setSlotDocs((prev) => ({
          ...prev,
          [slotKey]: {
            file: selectedFile,
            pageCount: n,
            docId: item.id,
            persisted: true,
            logicalDocumentId: item.logical_document_id ?? undefined,
            currentVersionId: item.current_version_id ?? undefined,
            currentVersionLabel: item.current_version_label ?? undefined,
            workflowStatus: item.workflow_status ?? undefined,
            logicalStatus: item.logical_status ?? undefined,
          },
        }));
        if (activate) void activateDoc(selectedFile, n, slotKey);
        setStatusNonce((v) => v + 1);
        return { persisted: true };
      } catch (error) {
        console.error("Slot persist failed:", error);
        const { pageCount: n } = await uploadFile(selectedFile);
        setSlotDocs((prev) => ({
          ...prev,
          [slotKey]: { file: selectedFile, pageCount: n, persisted: false },
        }));
        if (activate) void activateDoc(selectedFile, n, slotKey);
        return { persisted: false };
      }
    },
    [currentClient.id, periodKey, slotKeyFor, activateDoc, uploadFile, slotDocs],
  );

  const onFilesDroppedToSlot = useCallback(
    async (acceptedFiles: File[], slotIndex: number, slotLabel: string) => {
      if (!canUploadDocument) return;
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;
      const isPdf =
        selectedFile.type === "application/pdf" || /\.pdf$/i.test(selectedFile.name);
      if (!isPdf) {
        alert("この画面のプレビューはPDFのみ対応しています。PDFをアップロードしてください。");
        return;
      }
      if (!currentClient.id || currentClient.id === "unknown") {
        alert("顧客が選択されていません。");
        return;
      }
      setUploadStatus("uploading");
      setIsLoading(true);
      try {
        const { persisted } = await persistFileToSlot(selectedFile, slotIndex, slotLabel, true);
        setUploadStatus(persisted ? "success" : "error");
        setSlotNotice(
          persisted
            ? `「${slotLabel}」に保存しました（サーバー保存済み）。`
            : `「${slotLabel}」に取り込みました（サーバー保存に失敗・リロードで消えます）。`,
        );
        if (!persisted) {
          alert(
            "サーバーへの保存に失敗しました。バックエンド（http://localhost:8000）が起動しているか確認してください。",
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [canUploadDocument, currentClient.id, persistFileToSlot],
  );

  /** 自動振り分け: 複数PDFを分類し、高信頼かつ空きスロットは自動配置、それ以外は要確認キューへ。 */
  const onAutoSortFiles = useCallback(
    async (files: File[]) => {
      if (!canUploadDocument) return;
      if (!currentClient.id || currentClient.id === "unknown") {
        alert("顧客が選択されていません。");
        return;
      }
      const pdfs = files.filter(
        (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name),
      );
      if (pdfs.length === 0) return;
      const candidates = slotLabels.map((label, idx) => ({ id: String(idx), label }));
      const filledNow = new Set<number>();
      const queued: PendingReview[] = [];
      let autoCount = 0;
      setIsClassifying(true);
      try {
        for (const file of pdfs) {
          let bestIdx = NaN;
          let confidence = 0;
          let ranked: ClassifyRankedItem[] = [];
          let engine = "none";
          try {
            const result = await classifyDocument(file, candidates, currentClient.id);
            confidence = result.confidence;
            ranked = result.ranked;
            engine = result.engine;
            bestIdx = result.best ? Number(result.best.id) : NaN;
            const bestScore = result.best?.score ?? 0;
            const targetEmpty =
              Number.isInteger(bestIdx) &&
              !slotDocs[slotKeyFor(bestIdx)] &&
              !filledNow.has(bestIdx);
            if (confidence >= AUTO_SORT_THRESHOLD && bestScore >= 2 && targetEmpty) {
              await persistFileToSlot(file, bestIdx, slotLabels[bestIdx], false);
              filledNow.add(bestIdx);
              autoCount += 1;
              continue;
            }
          } catch (err) {
            console.error("Classify failed:", err);
          }
          queued.push({
            id: crypto.randomUUID(),
            file,
            fileName: file.name,
            confidence,
            engine,
            suggestedIndex: Number.isInteger(bestIdx) ? bestIdx : null,
            ranked,
          });
        }
        setPendingReview((prev) => [...queued, ...prev]);
        const parts: string[] = [];
        if (autoCount > 0) parts.push(`${autoCount}件を自動振り分け`);
        if (queued.length > 0) parts.push(`${queued.length}件は要確認`);
        setSlotNotice(
          parts.length > 0 ? `${parts.join(" / ")}しました。` : "振り分け対象がありませんでした。",
        );
      } finally {
        setIsClassifying(false);
      }
    },
    [canUploadDocument, currentClient.id, slotLabels, slotDocs, slotKeyFor, persistFileToSlot],
  );

  const onConfirmPending = useCallback(
    async (reviewId: string, slotIndex: number) => {
      const item = pendingReview.find((p) => p.id === reviewId);
      if (!item) return;
      await persistFileToSlot(item.file, slotIndex, slotLabels[slotIndex], false);
      setPendingReview((prev) => prev.filter((p) => p.id !== reviewId));
      setSlotNotice(`「${slotLabels[slotIndex]}」に確定しました。`);
    },
    [pendingReview, slotLabels, persistFileToSlot],
  );

  const onDismissPending = useCallback((reviewId: string) => {
    setPendingReview((prev) => prev.filter((p) => p.id !== reviewId));
  }, []);

  const onOpenSlot = useCallback(
    (slotIndex: number, mode: "preview" | "edit") => {
      const slotKey = slotKeyFor(slotIndex);
      const doc = slotDocs[slotKey];
      if (!doc) return;
      if (slotKey !== activeSlotKey) {
        void activateDoc(doc.file, doc.pageCount, slotKey, doc.docugridDocumentId);
      }
      useViewerUiStore.getState().open(mode, doc.file);
    },
    [slotDocs, activeSlotKey, slotKeyFor, activateDoc],
  );

  const onOpenSlotForAudit = useCallback(
    (slotIndex: number) => {
      const slotKey = slotKeyFor(slotIndex);
      const doc = slotDocs[slotKey];
      if (!doc) return;
      if (slotKey !== activeSlotKey) {
        void activateDoc(doc.file, doc.pageCount, slotKey, doc.docugridDocumentId);
      }
      const intent =
        doc.workflowStatus === "auditing" ? "audit-continue" : "audit-start";
      useViewerUiStore.getState().open("edit", doc.file, intent);
    },
    [slotDocs, activeSlotKey, slotKeyFor, activateDoc],
  );

  const activeSlotWorkflowStatus = activeSlotKey
    ? slotDocs[activeSlotKey]?.workflowStatus
    : undefined;

  useEffect(() => {
    if (!slotNotice) return;
    const t = window.setTimeout(() => setSlotNotice(null), 8000);
    return () => window.clearTimeout(t);
  }, [slotNotice]);

  // 顧客/期が変わったら要確認キューはクリア（別コンテキストのファイルを持ち越さない）
  useEffect(() => {
    setPendingReview([]);
  }, [currentClient.id, periodKey]);

  const onJumpToPeriod = useCallback((pk: string) => {
    if (pk === "perm") {
      setActivePeriodIdx(0);
      return;
    }
    const [mode, idxStr] = pk.split(":");
    const idx = Number(idxStr);
    if ((mode === "year" || mode === "month") && Number.isInteger(idx)) {
      setActiveMode(mode);
      setActivePeriodIdx(idx);
    }
  }, []);

  // 顧客全体の充足状況（全期間サマリ）を取得
  useEffect(() => {
    if (!canViewDocument) return;
    if (!currentClient.id || currentClient.id === "unknown") {
      setDocStatus(null);
      return;
    }
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const summary = await fetchDocumentStatus(currentClient.id, controller.signal);
        if (active) setDocStatus(summary);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.warn("Failed to load document status:", err);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [canViewDocument, currentClient.id, statusNonce]);

  useEffect(() => {
    if (!canViewDocument) return;
    if (!currentClient.id || currentClient.id === "unknown") return;
    const controller = new AbortController();
    let active = true;
    setTimelineLoading(true);
    void (async () => {
      try {
        const events = await listReviewTimeline(
          { clientId: currentClient.id, periodKey, limit: 40 },
          controller.signal,
        );
        if (active) setTimelineEvents(events);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.warn("Timeline load failed:", err);
        }
      } finally {
        if (active) setTimelineLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [canViewDocument, currentClient.id, periodKey, statusNonce]);

  // 顧客/期が変わったらサーバーに保存済みの資料を復元する
  useEffect(() => {
    if (!canViewDocument) return;
    if (!currentClient.id || currentClient.id === "unknown") return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        setIsHydratingSlots(true);
        const items = await listSlotDocuments(currentClient.id, periodKey, controller.signal);
        if (!active) return;
        const entries = await Promise.all(
          items.map(async (item) => {
            try {
              const restored = await fetchSlotDocumentFile(item, controller.signal);
              const key = `${currentClient.id}:${periodKey}:${item.slot_id}`;
              return [
                key,
                {
                  file: restored,
                  pageCount: item.page_count,
                  docId: item.id,
                  persisted: true,
                  logicalDocumentId: item.logical_document_id ?? undefined,
                  currentVersionId: item.current_version_id ?? undefined,
                  currentVersionLabel: item.current_version_label ?? undefined,
                  workflowStatus: item.workflow_status ?? undefined,
                  logicalStatus: item.logical_status ?? undefined,
                  docugridDocumentId: item.docugrid_document_id ?? undefined,
                } satisfies SlotDoc,
              ] as const;
            } catch {
              return null;
            }
          }),
        );
        if (!active) return;
        const hydrated: Record<string, SlotDoc> = {};
        for (const entry of entries) {
          if (entry) hydrated[entry[0]] = entry[1];
        }
        setSlotDocs((prev) => ({ ...prev, ...hydrated }));
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.warn("Slot hydration failed:", err);
        }
      } finally {
        if (active) setIsHydratingSlots(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currentClient.id, periodKey, canViewDocument]);

  // 監査・版管理後にメタデータだけ更新（PDF再取得はしない）
  useEffect(() => {
    if (!canViewDocument) return;
    if (!currentClient.id || currentClient.id === "unknown") return;
    if (statusNonce === 0) return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const items = await listSlotDocuments(currentClient.id, periodKey, controller.signal);
        if (!active) return;
        setSlotDocs((prev) => {
          const next = { ...prev };
          for (const item of items) {
            const key = `${item.client_id}:${item.period_key}:${item.slot_id}`;
            if (!next[key]) continue;
            next[key] = {
              ...next[key],
              docId: item.id,
              logicalDocumentId: item.logical_document_id ?? undefined,
              currentVersionId: item.current_version_id ?? undefined,
              currentVersionLabel: item.current_version_label ?? undefined,
              workflowStatus: item.workflow_status ?? undefined,
              logicalStatus: item.logical_status ?? undefined,
              docugridDocumentId: item.docugrid_document_id ?? undefined,
            };
          }
          return next;
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.warn("Slot metadata refresh failed:", err);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [statusNonce, currentClient.id, periodKey, canViewDocument]);

  const closeViewer = useCallback(() => {
    useViewerUiStore.getState().close();
  }, []);

  useLayoutEffect(() => {
    if (!isViewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isViewerOpen]);

  const logAnnotateReview = useCallback(
    (
      pageIdx: number,
      tool: string,
      rect: { x: number; y: number; w: number; h: number },
    ) => {
      if (!activeSlotKey) return;
      const scope = parseSlotKey(activeSlotKey);
      if (!scope) return;
      void createReviewEvent(scope, {
        event_type: "annotate",
        status: "draft",
        action_title: `${tool} 注釈`,
        detail: JSON.stringify({ page: pageIdx, tool, rect }),
      }).catch((err) => console.warn("annotate audit failed:", err));
    },
    [activeSlotKey],
  );

  const logExportPdfReview = useCallback(() => {
    if (!activeSlotKey) return;
    const scope = parseSlotKey(activeSlotKey);
    if (!scope) return;
    void createReviewEvent(scope, {
      event_type: "export_pdf",
      status: "draft",
      action_title: "PDF を出力",
      detail: JSON.stringify({ merge: true, source: "docugrid" }),
    }).catch((err) => console.warn("export_pdf audit failed:", err));
  }, [activeSlotKey]);

  const handleHighlight = useCallback(async (
    type: "box" | "marker" | "line" | "check" | "eraser",
    pageIdx: number,
    rect: { x: number, y: number, w: number, h: number },
    options?: { file?: File; updatePrimary?: boolean; path?: { x: number; y: number }[] },
  ) => {
    const targetFile = options?.file ?? file;
    if (!targetFile) return;
    const cleanName = targetFile.name.replace(/^(processed_)+/i, "").trim() || targetFile.name;
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      formData.append("page", pageIdx.toString());
      formData.append("x", rect.x.toString());
      formData.append("y", rect.y.toString());
      formData.append("w", rect.w.toString()); 
      formData.append("h", rect.h.toString());
      formData.append("type", type);
      if (options?.path && options.path.length > 0) {
        formData.append("path_json", JSON.stringify(options.path));
      }
      formData.append("include_render", "true");

      const response = await fetch(API_ENDPOINTS.HIGHLIGHT, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error(`${type} action failed`);

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as { pdf_base64: string; preview_png_base64?: string };
        const raw = atob(data.pdf_base64);
        const pdfBytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) pdfBytes[i] = raw.charCodeAt(i);
        const updatedFile = new File([pdfBytes], `processed_${cleanName}`, {
          type: "application/pdf",
        });
        if (options?.updatePrimary !== false) {
          setFile(updatedFile);
          assignPreviewFromFile(updatedFile);
          if (activeSlotKey) {
            setSlotDocs((prev) => {
              const cur = prev[activeSlotKey];
              if (!cur) return prev;
              return { ...prev, [activeSlotKey]: { ...cur, file: updatedFile } };
            });
          }
        }
        logAnnotateReview(pageIdx, type, rect);
        scheduleAnnotationSnapshotRef.current(updatedFile);
        if (data.preview_png_base64) {
          return {
            file: updatedFile,
            previewDataUrl: `data:image/png;base64,${data.preview_png_base64}`,
          };
        }
        return updatedFile;
      }

      const blob = await response.blob();
      const updatedFile = new File([blob], `processed_${cleanName}`, { type: blob.type || "application/pdf" });
      if (options?.updatePrimary !== false) {
        setFile(updatedFile);
        assignPreviewFromFile(updatedFile);
        if (activeSlotKey) {
          setSlotDocs((prev) => {
            const cur = prev[activeSlotKey];
            if (!cur) return prev;
            return { ...prev, [activeSlotKey]: { ...cur, file: updatedFile } };
          });
        }
      }
      logAnnotateReview(pageIdx, type, rect);
      scheduleAnnotationSnapshotRef.current(updatedFile);
      return updatedFile;
    } catch (error) {
      console.error(error);
      alert(`${type}処理に失敗しました。`);
    }
  }, [file, assignPreviewFromFile, activeSlotKey, logAnnotateReview]);

  const handleReorder = useCallback(async (newOrderIndices: number[]) => {
    if (!file || !canAnnotateDocument) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const orderStr = newOrderIndices.join(",");
      formData.append("order", orderStr);
      const response = await fetch(API_ENDPOINTS.REORDER, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error("Reorder failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `reordered_${file.name}`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      assignPreviewFromFile(updatedFile);
      return updatedFile;
    } catch (error) {
      alert("並べ替え処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [file, assignPreviewFromFile, canAnnotateDocument]);

  const handleMerge = useCallback(async (filesToMerge: File[]) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      filesToMerge.forEach(f => formData.append("files", f));
      const response = await fetch(API_ENDPOINTS.MERGE, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error("Merge failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `merged.pdf`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      assignPreviewFromFile(updatedFile);
      return updatedFile;
    } catch (error) {
      alert("結合処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [assignPreviewFromFile]);

  const handleGetThumbnails = useCallback(async () => {
    if (!file) return [];
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(API_ENDPOINTS.THUMBNAILS, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (data.thumbnails && data.thumbnails.length > 0) {
        setPageCount(data.thumbnails.length);
      }
      return data.thumbnails as string[];
    } catch (error) {
      return [];
    }
  }, [file]);

  // ★修正: 第2引数で fileOverride を受け取れるように変更
  // これにより、State更新を待たずに「今できたファイル」で即時レンダリングできる
  const handleRenderPage = useCallback(async (pageIdx: number, fileOverride?: File) => {
    const targetFile = fileOverride || file;
    if (!targetFile) return null;
    
    try {
        const formData = new FormData();
        formData.append("file", targetFile);
        formData.append("page", pageIdx.toString());
        const response = await fetch(API_ENDPOINTS.RENDER_PAGE, {
          method: "POST",
          body: formData,
          headers: buildAuthHeaders(),
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Render Page Error:", error);
        return null;
    }
  }, [file]);

  const slotIdentity = useMemo(() => {
    if (!activeSlotKey) return undefined;
    const parts = activeSlotKey.split(":");
    if (parts.length < 3) return undefined;
    return {
      clientId: parts[0],
      slotId: parts[parts.length - 1],
      periodKey: parts.slice(1, -1).join(":"),
    };
  }, [activeSlotKey]);

  const activeSlotLabel = useMemo(() => {
    if (!activeSlotKey) return undefined;
    const idx = Number(activeSlotKey.split(":").pop());
    return Number.isInteger(idx) ? slotLabels[idx] : undefined;
  }, [activeSlotKey, slotLabels]);

  const onVersionCreated = useCallback(
    (meta: {
      versionId: string;
      versionLabel: string;
      logicalDocumentId?: string;
      workflowStatus?: string;
      file: File;
    }) => {
      if (!activeSlotKey) return;
      setSlotDocs((prev) => {
        const cur = prev[activeSlotKey];
        if (!cur) return prev;
        return {
          ...prev,
          [activeSlotKey]: {
            ...cur,
            file: meta.file,
            currentVersionId: meta.versionId,
            currentVersionLabel: meta.versionLabel,
            logicalDocumentId: meta.logicalDocumentId ?? cur.logicalDocumentId,
            workflowStatus: meta.workflowStatus ?? cur.workflowStatus,
            logicalStatus: "uploaded",
          },
        };
      });
      setFile(meta.file);
      assignPreviewFromFile(meta.file);
      setStatusNonce((v) => v + 1);
    },
    [activeSlotKey, assignPreviewFromFile],
  );

  scheduleAnnotationSnapshotRef.current = (updatedFile: File) => {
    if (!canAnnotateDocument || !activeSlotKey) return;
    const scope = parseSlotKey(activeSlotKey);
    if (!scope) return;
    const idx = Number(activeSlotKey.split(":").pop());
    const label = Number.isInteger(idx) ? slotLabels[idx] : undefined;
    if (annotationSnapshotTimerRef.current) {
      clearTimeout(annotationSnapshotTimerRef.current);
    }
    annotationSnapshotTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const snap = await createDocumentVersionSnapshot(
            scope,
            updatedFile,
            "minor",
            label,
          );
          onVersionCreated({
            versionId: snap.id,
            versionLabel: snap.version_label,
            logicalDocumentId: snap.logical_document_id,
            file: updatedFile,
          });
        } catch (err) {
          console.warn("annotation version snapshot failed:", err);
        }
      })();
    }, 8000);
  };

  useEffect(() => {
    return () => {
      if (annotationSnapshotTimerRef.current) {
        clearTimeout(annotationSnapshotTimerRef.current);
      }
    };
  }, []);

  const onAuditStateChange = useCallback(() => {
    setStatusNonce((v) => v + 1);
  }, []);

  const slotCount = 4;
  const filledInView = Array.from({ length: slotCount }, (_, i) => slotKeyFor(i)).filter(
    (k) => slotDocs[k],
  ).length;
  const progressPercent =
    activePeriodIdx === 0 ? 100 : Math.round((filledInView / slotCount) * 100);

  if (!authChecked) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
          aria-hidden
        />
        <p className="text-sm font-medium">読み込み中…</p>
      </div>
    );
  }

  return (
    <>
    <div className="flex h-screen flex-col bg-slate-100 text-slate-600 overflow-hidden font-sans">
      <NavBar currentStaff={effectiveStaff} activeClientIdx={activeClientIdx} onClientChange={setActiveClientIdx} onStaffChange={onStaffChange} onStaffSwitch={() => onStaffChange(1)} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Sidebar activeMode={activeMode} activePeriodIdx={activePeriodIdx} onPeriodChange={setActivePeriodIdx} onModeSwitch={() => { setActiveMode((prev) => (prev === "year" ? "month" : "year")); setActivePeriodIdx(1); }} />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <MatrixGrid
            currentClient={currentClient}
            activePeriodIdx={activePeriodIdx}
            activeMode={activeMode}
            slotLabels={slotLabels}
            displayOrder={slotDisplayOrder}
            onSlotLayoutChange={applySlotLayout}
            onClearSlot={handleClearSlot}
            slotDocs={slotDocs}
            slotKeyFor={slotKeyFor}
            progressPercent={progressPercent}
            onFilesDroppedToSlot={onFilesDroppedToSlot}
            onOpenSlot={onOpenSlot}
            onOpenSlotForAudit={onOpenSlotForAudit}
            canApproveAudit={canApproveAudit}
            slotNotice={slotNotice}
            onDismissSlotNotice={() => setSlotNotice(null)}
            relatedClients={relatedClients}
            onSelectRelatedClient={onSelectRelatedClient}
            canUpload={canUploadDocument}
            canView={canViewDocument}
            onAutoSortFiles={onAutoSortFiles}
            isClassifying={isClassifying}
            pendingReview={pendingReview.map((p) => ({
              id: p.id,
              fileName: p.fileName,
              confidence: p.confidence,
              engine: p.engine,
              suggestedIndex: p.suggestedIndex,
              ranked: p.ranked.map((r) => ({ id: r.id, label: r.label, score: r.score })),
            }))}
            onConfirmPending={onConfirmPending}
            onDismissPending={onDismissPending}
            docStatus={docStatus}
            currentPeriodKey={periodKey}
            onJumpToPeriod={onJumpToPeriod}
            onSaveDocugridNow={saveDocugridNow}
            onPdfExported={logExportPdfReview}
            timelineEvents={timelineEvents}
            timelineLoading={timelineLoading}
          />
        </div>
      </div>
      {isHydratingSlots ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          保存済みの資料を復元中…
        </div>
      ) : null}
    </div>
    {isViewerOpen && file ? (
      <ViewerModal
        isOpen
        onClose={closeViewer}
        viewerMode={viewerMode}
        onViewerModeChange={(mode) => useViewerUiStore.getState().setMode(mode)}
        file={file}
        pdfUrl={pdfUrl}
        viewerSession={viewerSession}
        pageCount={pageCount}
        uploadStatus={uploadStatus}
        isLoading={isLoading}
        onHighlight={handleHighlight}
        onReorder={handleReorder}
        onMerge={handleMerge}
        onGetThumbnails={handleGetThumbnails}
        onRenderPage={handleRenderPage}
        canAnnotate={canAnnotateDocument}
        canApprove={canApproveAudit}
        syncWithDocugrid={docugridPageCount > 0}
        slotIdentity={slotIdentity}
        slotLabel={activeSlotLabel}
        onVersionCreated={onVersionCreated}
        onAuditStateChange={onAuditStateChange}
        slotWorkflowStatus={activeSlotWorkflowStatus}
      />
    ) : null}
    </>
  );
}
