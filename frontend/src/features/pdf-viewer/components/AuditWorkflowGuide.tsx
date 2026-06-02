"use client";

import { ClipboardCheck, X } from "lucide-react";
import type { WorkflowStatus } from "../types";

type AuditWorkflowGuideProps = {
  status: WorkflowStatus;
  serverStatus?: string;
  canApprove: boolean;
  isReadOnly: boolean;
  highlightAuditStart?: boolean;
  onDismiss?: () => void;
};

const STEPS = [
  { key: "edit", label: "① 編集する", desc: "マトリクスから PDF を開く" },
  { key: "request", label: "② 承認依頼", desc: "担当がレビュー待ちにする" },
  { key: "start", label: "③ 監査開始", desc: "承認者が 2 画面照合へ" },
  { key: "done", label: "④ 承認完了", desc: "問題なければ確定" },
] as const;

export const AuditWorkflowGuide = ({
  status,
  serverStatus,
  canApprove,
  isReadOnly,
  highlightAuditStart,
  onDismiss,
}: AuditWorkflowGuideProps) => {
  if (isReadOnly) {
    return (
      <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950">
        <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p>
          監査・照合は<strong>「編集する」</strong>で開いたビューアから行います。プレビューでは操作できません。
        </p>
      </div>
    );
  }

  const effective = status === "draft" && serverStatus ? serverStatus : status;
  const activeStep =
    effective === "review_pending"
      ? 2
      : effective === "auditing"
        ? 3
        : effective === "done"
          ? 4
          : effective === "rejected" || effective === "fix"
            ? 1
            : 1;

  let message: string | null = null;
  if (effective === "draft" && canApprove) {
    message = "担当の「承認依頼」後に、ヘッダーの「監査開始」が表示されます。";
  } else if (effective === "draft" && !canApprove) {
    message = "作業後にヘッダーの「承認依頼」を出すと、監査担当に回ります。";
  } else if (effective === "review_pending" && canApprove) {
    message = highlightAuditStart
      ? "右の「監査開始」を押すと 2 画面照合が始まります（チェックツールで左右を紐づけ）。"
      : "承認待ちです。ヘッダーの「監査開始」で照合を始めてください。";
  } else if (effective === "review_pending" && !canApprove) {
    message = "監査担当の承認待ちです。承認者が「監査開始」します。";
  } else if (effective === "auditing") {
    message = "照合中です。「2画面」＋チェック（✓）で左右の対応箇所をリンクできます。";
  }

  if (!message && effective === "done") return null;

  return (
    <div className="relative flex items-start gap-3 border-b border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-950">
      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
      <div className="min-w-0 flex-1">
        <p className="mb-2 font-bold text-indigo-900">監査の進め方</p>
        <ol className="mb-2 flex flex-wrap gap-2">
          {STEPS.map((step, i) => {
            const n = i + 1;
            const isActive = n === activeStep;
            const isDone = n < activeStep;
            return (
              <li
                key={step.key}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isDone
                      ? "bg-indigo-200 text-indigo-800"
                      : "bg-white text-indigo-600 ring-1 ring-indigo-200"
                }`}
                title={step.desc}
              >
                {step.label}
              </li>
            );
          })}
        </ol>
        {message ? <p className="leading-relaxed">{message}</p> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-indigo-600 hover:bg-indigo-100"
          aria-label="ガイドを閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};
