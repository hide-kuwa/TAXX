"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import type { ReviewTimelineItem } from "@/features/pdf-viewer/lib/review-events";
import { PageGrid } from "@/features/docugrid/components/Grid/PageGrid";
import { SyncStatusBadge } from "@/features/docugrid/components/SyncStatusBadge";
import { useMergePdf } from "@/features/docugrid/hooks/useMergePdf";
import { useDocugridStore } from "@/features/docugrid/state/docugrid-store";
import { useViewerUiStore } from "@/features/pdf-viewer/state/viewer-ui-store";
import { Client } from "./types";
import { PERIODS } from "./mockData";
import type { DocumentStatusSummary } from "@/features/docugrid/lib/document-status";

const WORKFLOW_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "未チェック", className: "bg-slate-100 text-slate-600" },
  review_pending: { label: "レビュー待ち", className: "bg-amber-50 text-amber-700" },
  auditing: { label: "チェック中", className: "bg-indigo-50 text-indigo-700" },
  done: { label: "承認済", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "差戻し", className: "bg-red-50 text-red-700" },
  fix: { label: "修正中", className: "bg-orange-50 text-orange-700" },
};

const LOGICAL_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  processing: { label: "処理中", className: "bg-amber-50 text-amber-700" },
  approved: { label: "論理承認", className: "bg-emerald-50 text-emerald-700" },
  remanded: { label: "差戻し", className: "bg-red-50 text-red-700" },
};

const TIMELINE_EVENT_LABEL: Record<string, string> = {
  upload: "アップロード",
  work_save: "作業保存",
  audit_start: "監査開始",
  approve: "承認",
  remand: "差戻し",
  page_view: "ページ閲覧",
  annotate: "注釈",
  export_pdf: "PDF出力",
  viewer_open_preview: "プレビュー",
  viewer_open_edit: "編集開始",
  viewer_close: "ビューア終了",
  audit_link_create: "監査リンク",
};

function formatTimelineWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export type PendingReviewView = {
  id: string;
  fileName: string;
  confidence: number;
  engine: string;
  suggestedIndex: number | null;
  ranked: Array<{ id: string; label: string; score: number }>;
};

interface MatrixGridProps {
  currentClient: Client;
  activePeriodIdx: number;
  activeMode: "year" | "month";
  slotItems: string[];
  slotDocs: Record<
    string,
    {
      file: File;
      pageCount: number | null;
      currentVersionLabel?: string;
      workflowStatus?: string;
      logicalStatus?: string;
    }
  >;
  slotKeyFor: (slotIndex: number) => string;
  progressPercent: number;
  onFilesDroppedToSlot: (files: File[], slotIndex: number, slotLabel: string) => void;
  onOpenSlot: (slotIndex: number, mode: "preview" | "edit") => void;
  slotNotice: string | null;
  onDismissSlotNotice: () => void;
  relatedClients: Array<{ id: string; name: string; relation: string }>;
  onSelectRelatedClient: (clientId: string) => void;
  canUpload: boolean;
  canView: boolean;
  onAutoSortFiles: (files: File[]) => void;
  isClassifying: boolean;
  pendingReview: PendingReviewView[];
  onConfirmPending: (reviewId: string, slotIndex: number) => void;
  onDismissPending: (reviewId: string) => void;
  docStatus: DocumentStatusSummary | null;
  currentPeriodKey: string;
  onJumpToPeriod: (periodKey: string) => void;
  onSaveDocugridNow?: () => Promise<string | undefined>;
  onPdfExported?: () => void;
  timelineEvents?: ReviewTimelineItem[];
  timelineLoading?: boolean;
}

const periodLabel = (pk: string): string => {
  if (pk === "perm") return "永続";
  const [mode, idxStr] = pk.split(":");
  const idx = Number(idxStr) - 1;
  if (mode === "year") return PERIODS.year[idx] ?? pk;
  if (mode === "month") return PERIODS.month[idx] ?? pk;
  return pk;
};

export default function MatrixGrid({
  currentClient,
  activePeriodIdx,
  activeMode,
  slotItems,
  slotDocs,
  slotKeyFor,
  progressPercent,
  onFilesDroppedToSlot,
  onOpenSlot,
  slotNotice,
  onDismissSlotNotice,
  relatedClients,
  onSelectRelatedClient,
  canUpload,
  canView,
  onAutoSortFiles,
  isClassifying,
  pendingReview,
  onConfirmPending,
  onDismissPending,
  docStatus,
  currentPeriodKey,
  onJumpToPeriod,
  onSaveDocugridNow,
  onPdfExported,
  timelineEvents = [],
  timelineLoading = false,
}: MatrixGridProps) {
  const [pagePanelOpen, setPagePanelOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const items = slotItems;

  const missingCurrent = items.filter((_, i) => !slotDocs[slotKeyFor(i)]);
  const incompletePeriods = (docStatus?.periods ?? []).filter(
    (p) => !p.complete && p.period_key !== currentPeriodKey,
  );

  const pageOrderLen = useDocugridStore((s) => s.pageOrder.length);
  const sessionSyncStatus = useDocugridStore((s) => s.sessionSyncStatus);
  const { mergeFromStore, isMerging } = useMergePdf({
    onExportSuccess: onPdfExported,
  });

  const remandedSlots = items
    .map((label, i) => ({ label, doc: slotDocs[slotKeyFor(i)] }))
    .filter(({ doc }) => doc?.workflowStatus === "rejected" || doc?.workflowStatus === "fix");

  const currentPendingApproval =
    docStatus?.periods.find((p) => p.period_key === currentPeriodKey)?.pending_approval ?? [];

  const todayTaskCount =
    pendingReview.length +
    remandedSlots.length +
    missingCurrent.length +
    currentPendingApproval.length;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<{ index: number; label: string } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const autoSortInputRef = useRef<HTMLInputElement>(null);
  const [autoDragActive, setAutoDragActive] = useState(false);

  const acceptAutoSortFiles = useCallback(
    (picked: FileList | File[]) => {
      if (!canUpload) return;
      const list = Array.from(picked).filter(
        (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name),
      );
      if (list.length === 0) return;
      onAutoSortFiles(list);
    },
    [canUpload, onAutoSortFiles],
  );

  const acceptPdfFiles = useCallback(
    (picked: FileList | File[], slotIndex: number, slotLabel: string) => {
      if (!canUpload) return;
      const list = Array.from(picked).filter(
        (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name),
      );
      if (list.length === 0) return;
      void Promise.resolve(onFilesDroppedToSlot(list, slotIndex, slotLabel)).catch((err) => {
        console.error("File drop failed:", err);
        alert("ファイルの取り込みに失敗しました。");
      });
    },
    [canUpload, onFilesDroppedToSlot],
  );

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-slate-100 transition-opacity duration-300 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const pending = pendingSlotRef.current;
          if (pending && e.target.files && e.target.files.length > 0) {
            acceptPdfFiles(e.target.files, pending.index, pending.label);
          }
          e.target.value = "";
        }}
      />
      <input
        ref={autoSortInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            acceptAutoSortFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />
      {slotNotice ? (
        <div
          role="status"
          className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm md:mx-8"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="min-w-0 flex-1 font-medium leading-snug">{slotNotice}</p>
          <button
            type="button"
            onClick={onDismissSlotNotice}
            className="shrink-0 rounded p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="通知を閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <header className="z-10 flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
        <div className="min-w-0 max-w-full flex-1 basis-[min(100%,18rem)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">CLIENT</div>
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                currentClient.fiscal === 3
                  ? "border-red-200 bg-red-100 text-red-500"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              {currentClient.fiscal}月決算
            </span>
          </div>
          <div className="break-words text-xl font-bold leading-snug text-slate-800">
            {activePeriodIdx === 0 ? (
              <span className="text-yellow-500">永久保存ドキュメント</span>
            ) : (
              <span>
                <span
                  className={`mr-2 inline ${
                    activeMode === "year" ? "text-blue-600" : "text-green-500"
                  }`}
                >
                  {activeMode === "year"
                    ? PERIODS.year[activePeriodIdx - 1]
                    : PERIODS.month[activePeriodIdx - 1]}
                </span>
                {activeMode === "year" ? "決算資料" : "月次監査"}
              </span>
            )}
          </div>
        </div>
        <div className="flex w-full min-w-[12rem] shrink-0 flex-wrap items-center justify-end gap-3 sm:ml-auto sm:w-auto">
          {relatedClients.length > 0 && (
            <div className="w-full min-w-0 max-w-full shrink-0 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 sm:max-w-[min(100%,380px)]">
              <div className="mb-1 whitespace-normal text-[10px] font-bold uppercase tracking-wider text-slate-500">
                関係先クライアント
              </div>
              <div className="flex flex-wrap gap-1.5">
                {relatedClients.slice(0, 4).map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectRelatedClient(client.id)}
                    className="max-w-full break-words rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-left text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                    title={client.relation}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="ml-auto shrink-0 text-right sm:ml-0">
            <span className="text-2xl font-black text-brand-600">{progressPercent}%</span>
          </div>
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90 transform">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#3b82f6"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="125"
                strokeDashoffset={125 - (125 * progressPercent) / 100}
                className="transition-all duration-700"
              />
            </svg>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {canView && todayTaskCount > 0 && (
          <section className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <h3 className="text-sm font-bold text-indigo-900">今日やること</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-indigo-950">
              {missingCurrent.length > 0 && (
                <li>
                  · この期間の不足資料: <strong>{missingCurrent.length} 点</strong>（
                  {missingCurrent.slice(0, 3).join("、")}
                  {missingCurrent.length > 3 ? "…" : ""}）
                </li>
              )}
              {currentPendingApproval.length > 0 && (
                <li>
                  · 承認待ち: <strong>{currentPendingApproval.length} 点</strong>（
                  {currentPendingApproval.slice(0, 3).join("、")}
                  {currentPendingApproval.length > 3 ? "…" : ""}）
                </li>
              )}
              {pendingReview.length > 0 && (
                <li>
                  · 自動振り分けの要確認: <strong>{pendingReview.length} 件</strong>
                </li>
              )}
              {remandedSlots.length > 0 && (
                <li>
                  · 差戻し・修正中: <strong>{remandedSlots.length} 点</strong>（
                  {remandedSlots
                    .slice(0, 3)
                    .map((s) => s.label)
                    .join("、")}
                  {remandedSlots.length > 3 ? "…" : ""}）
                </li>
              )}
              {(docStatus?.pending_approval_total ?? 0) > currentPendingApproval.length && (
                <li>
                  · 他期間の承認待ち合計:{" "}
                  <strong>
                    {(docStatus?.pending_approval_total ?? 0) - currentPendingApproval.length} 点
                  </strong>
                </li>
              )}
            </ul>
          </section>
        )}

        <div
          className={`mb-5 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 ${
            missingCurrent.length === 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          {missingCurrent.length === 0 && currentPendingApproval.length === 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden />
              <span className="text-sm font-bold text-emerald-800">
                この期間の必要書類はすべて揃っています
                {docStatus?.periods.find((p) => p.period_key === currentPeriodKey)?.approved_complete
                  ? "（承認済み）"
                  : ""}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />
              <span className="text-sm font-black text-rose-700">
                あと {missingCurrent.length} 点
              </span>
              <span className="text-xs font-medium text-rose-500">不足:</span>
              <div className="flex flex-wrap gap-1.5">
                {missingCurrent.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[11px] font-bold text-rose-600"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {missingCurrent.length === 0 && currentPendingApproval.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            <span className="text-sm font-bold text-amber-800">
              承認待ち {currentPendingApproval.length} 点
            </span>
            <span className="text-xs text-amber-700">{currentPendingApproval.join("、")}</span>
          </div>
        )}

        {canUpload && (
          <div
            role="button"
            tabIndex={0}
            onDragEnter={(e) => {
              e.preventDefault();
              setAutoDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setAutoDragActive(true);
            }}
            onDragLeave={() => setAutoDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAutoDragActive(false);
              if (e.dataTransfer.files.length > 0) acceptAutoSortFiles(e.dataTransfer.files);
            }}
            onClick={() => autoSortInputRef.current?.click()}
            className={`mb-5 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
              autoDragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-indigo-300 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50"
            }`}
          >
            {isClassifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" aria-hidden />
                <span className="text-sm font-bold text-indigo-700">自動振り分け中…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
                <div className="text-left">
                  <div className="text-sm font-black text-indigo-700">
                    まとめてドロップで自動振り分け
                  </div>
                  <div className="text-[11px] font-medium text-indigo-500">
                    複数PDFをここに入れると、AIが書類種別を判定して自動で各枠に収納します（判定が曖昧なものは下の「要確認」へ）。
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {pendingReview.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-800">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              要確認（{pendingReview.length}件） — 振り分け先を選んでください
            </div>
            <div className="space-y-3">
              {pendingReview.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-xs font-bold text-slate-700">
                        {p.fileName}
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                        確信度 {Math.round(p.confidence * 100)}% ・ 抽出 {p.engine === "none" ? "不可（スキャン）" : p.engine}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDismissPending(p.id)}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="このファイルを破棄"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((label, idx) => {
                      const isSuggested = p.suggestedIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onConfirmPending(p.id, idx)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            isSuggested
                              ? "border-indigo-400 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSuggested ? "★ " : ""}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canView && (
          <section className="mb-5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setTimelineOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Clock className="h-4 w-4 text-slate-500" aria-hidden />
                監査タイムライン
                {timelineEvents.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {timelineEvents.length}
                  </span>
                ) : null}
              </span>
              {timelineOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </button>
            {timelineOpen ? (
              <div className="border-t border-slate-100 px-4 py-3">
                {timelineLoading ? (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    読み込み中…
                  </p>
                ) : timelineEvents.length === 0 ? (
                  <p className="text-xs text-slate-500">この期間の監査イベントはまだありません。</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {timelineEvents.map((ev) => {
                      const slotTitle =
                        ev.slot_label ??
                        items[Number(ev.slot_id)] ??
                        `スロット ${ev.slot_id}`;
                      const typeLabel =
                        ev.action_title ??
                        TIMELINE_EVENT_LABEL[ev.event_type] ??
                        ev.event_type;
                      return (
                        <li
                          key={ev.id}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                        >
                          <time className="shrink-0 font-mono text-[10px] text-slate-400">
                            {formatTimelineWhen(ev.created_at)}
                          </time>
                          <span className="font-bold text-slate-700">{slotTitle}</span>
                          <span className="text-slate-600">{typeLabel}</span>
                          {ev.version_label ? (
                            <span className="font-mono text-[10px] text-blue-600">{ev.version_label}</span>
                          ) : null}
                          {ev.actor_email ? (
                            <span className="ml-auto text-[10px] text-slate-400">{ev.actor_email}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        )}

        <div className="grid min-w-0 grid-cols-2 gap-4 fade-in-up md:grid-cols-3 lg:grid-cols-4 [&>*]:min-w-[9rem]">
          {items.map((title, i) => {
            const uploadedCardClass =
              "bg-white min-h-[8.5rem] rounded-xl border-l-4 border-blue-600 shadow-sm p-4 flex flex-col justify-between";
            const doc = slotDocs[slotKeyFor(i)];

            if (doc?.file) {
              const workflowBadge = doc.workflowStatus
                ? WORKFLOW_STATUS_BADGE[doc.workflowStatus]
                : null;
              const logicalBadge =
                doc.logicalStatus && doc.logicalStatus !== "uploaded"
                  ? LOGICAL_STATUS_BADGE[doc.logicalStatus]
                  : null;
              return (
                <div key={i} className={`relative z-10 ${uploadedCardClass} shadow-md ring-2 ring-blue-100`}>
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <FileText className="shrink-0 text-xl text-blue-600" />
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          収納済み
                        </span>
                        {doc.logicalStatus === "processing" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            処理中
                          </span>
                        ) : null}
                        {doc.currentVersionLabel ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                            {doc.currentVersionLabel}
                          </span>
                        ) : null}
                        {logicalBadge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${logicalBadge.className}`}
                          >
                            {logicalBadge.label}
                          </span>
                        ) : null}
                        {workflowBadge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${workflowBadge.className}`}
                          >
                            {workflowBadge.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="line-clamp-1 text-xs font-bold text-slate-400">{doc.file.name}</div>
                    <div className="break-words text-sm font-bold leading-tight text-slate-700">{title}</div>
                    {doc.pageCount != null && doc.pageCount > 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">{doc.pageCount} ページ</p>
                    )}
                  </div>
                  {canView && (
                    <div className="relative z-50 mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => onOpenSlot(i, "preview")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        プレビュー
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSlot(i, "edit")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        編集する
                      </button>
                    </div>
                  )}
                  <p className="mt-2 hidden text-[10px] leading-snug text-slate-400 sm:block">
                    ハイライト・並べ替えは「編集する」から
                  </p>
                </div>
              );
            }

            const slotDragActive = dragOverSlot === i;
            return (
              <div
                key={i}
                role="button"
                tabIndex={canUpload ? 0 : -1}
                onDragEnter={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  setDragOverSlot(i);
                }}
                onDragOver={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  setDragOverSlot(i);
                }}
                onDragLeave={() => {
                  setDragOverSlot((prev) => (prev === i ? null : prev));
                }}
                onDrop={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverSlot(null);
                  if (e.dataTransfer.files.length > 0) acceptPdfFiles(e.dataTransfer.files, i, title);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canUpload) return;
                  pendingSlotRef.current = { index: i, label: title };
                  fileInputRef.current?.click();
                }}
                className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-2 text-center transition-colors group ${
                  slotDragActive
                    ? "scale-105 border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-white"
                } ${canUpload ? "" : "cursor-not-allowed opacity-60 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                {!canUpload ? (
                  <div className="text-xs font-bold text-slate-500">アップロード権限なし</div>
                ) : slotDragActive ? (
                  <>
                    <UploadCloud className="mb-2 h-8 w-8 animate-bounce text-blue-600" />
                    <div className="text-sm font-black text-blue-600">ここにドロップ</div>
                  </>
                ) : (
                  <>
                    <Plus className="mb-2 text-slate-300 group-hover:text-blue-500" />
                    <div className="text-xs font-bold text-slate-400 group-hover:text-blue-500">{title}</div>
                    <div className="mt-1 text-[10px] font-medium text-slate-400">PDF_ここにドロップ</div>
                  </>
                )}
              </div>
            );
})}
        </div>
      </div>

      {canView && docStatus && (
        <section className="border-t border-slate-200 bg-white/90">
          <button
            type="button"
            onClick={() => setDashboardOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left md:px-8 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              資料の充足状況（全期間）
              {docStatus.missing_total > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                  不足 合計 {docStatus.missing_total} 点 ・ {docStatus.incomplete_count} 期間
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  不足なし
                </span>
              )}
            </span>
            {dashboardOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            )}
          </button>
          {dashboardOpen && (
            <div className="px-4 pb-4 md:px-8">
              {incompletePeriods.length === 0 ? (
                <p className="text-xs text-slate-500">
                  アップロード実績のある他の期間に不足はありません。
                </p>
              ) : (
                <div className="space-y-2">
                  {incompletePeriods.map((p) => (
                    <button
                      key={p.period_key}
                      type="button"
                      onClick={() => onJumpToPeriod(p.period_key)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700">
                        {periodLabel(p.period_key)}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-rose-600">
                        あと {p.missing.length} 点
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
                        {p.missing.join(" / ")}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-blue-600">
                        この期間へ →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {canView && pageOrderLen > 0 && (
        <section className="border-t border-slate-200 bg-white/90">
          <button
            type="button"
            onClick={() => setPagePanelOpen((o: boolean) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left md:px-8 hover:bg-slate-50"
          >
            <span className="text-sm font-bold text-slate-700">
              ページの並び
              <span className="ml-2 text-xs font-normal text-slate-500">（任意・編集しなくても提出可）</span>
            </span>
            {pagePanelOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            )}
          </button>
          {pagePanelOpen && <PageGrid />}
        </section>
      )}

      {canUpload && pageOrderLen > 0 && (
        <div className="sticky bottom-0 z-30 flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur md:px-8">
          <div className="mr-auto flex items-center gap-2">
            <p className="hidden text-[11px] text-slate-500 sm:block">
              必要なときだけ編集し、PDF を出力できます。
            </p>
            <SyncStatusBadge status={sessionSyncStatus} variant="inline" />
            <span className="text-[10px] text-slate-400">セッション同期</span>
            {sessionSyncStatus === "dirty" && onSaveDocugridNow ? (
              <button
                type="button"
                onClick={() => {
                  void onSaveDocugridNow().catch((err) => {
                    console.warn("Docugrid manual save failed:", err);
                  });
                }}
                className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
              >
                今すぐ保存
              </button>
            ) : null}
          </div>
          <button
            type="button"
            disabled={isMerging}
            onClick={async () => {
              const r = await mergeFromStore(true);
              if (!r.ok) {
                alert(r.error);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                出力中…
              </>
            ) : (
              <>PDF を出力</>
            )}
          </button>
        </div>
      )}
    </main>
  );
}
