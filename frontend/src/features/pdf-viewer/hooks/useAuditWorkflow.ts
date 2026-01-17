import { useEffect, useState } from "react";
import { AuditTarget, EnhancedDocVersion, INITIAL_HISTORY, WorkflowStatus } from "../types";

type UseAuditWorkflowParams = {
  file: File | null;
  pdfUrl: string | null;
  isOpen: boolean;
  onAuditStart: () => void;
  onAuditEnd: () => void;
};

type CreateNewVersionParams = {
  type: "minor" | "major" | "audit_start";
  actionTitle: string;
  status: WorkflowStatus;
  user: string;
};

export const useAuditWorkflow = ({ file, pdfUrl, isOpen, onAuditStart, onAuditEnd }: UseAuditWorkflowParams) => {
  const [history, setHistory] = useState<EnhancedDocVersion[]>(INITIAL_HISTORY);
  const [activeVerIdx, setActiveVerIdx] = useState(0);
  const [actionsLog, setActionsLog] = useState<string[]>([]);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<WorkflowStatus>(INITIAL_HISTORY[0].status);

  useEffect(() => {
    if (isOpen) {
      setActiveVerIdx(0);
      setExpandedHistoryIdx(null);
      setCurrentStatus(history[0]?.status ?? INITIAL_HISTORY[0].status);
    }
  }, [isOpen, history]);

  useEffect(() => {
    if (isOpen && file) {
      setHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) newHistory[0] = { ...newHistory[0], file: file };
        return newHistory;
      });
      if (activeVerIdx === 0 && actionsLog.length > 0) {
        setActionsLog([]);
      }
    }
  }, [isOpen, file, pdfUrl, activeVerIdx, actionsLog]);

  const recordAction = (newFile: File | void, actionName: string, target: AuditTarget = "primary") => {
    if (!newFile) return;
    setActionsLog((prev) => [actionName, ...prev]);
    if (target === "primary") {
      setHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) newHistory[0] = { ...newHistory[0], file: newFile as File };
        return newHistory;
      });
    }
  };

  const createNewVersion = ({ type, actionTitle, status, user }: CreateNewVersionParams) => {
    if (!file) return;
    const date = new Date().toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    setHistory((prev) => {
      const currentVerStr = prev[0].ver;
      const parts = currentVerStr.replace("v", "").split(".").map(Number);
      let [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];

      if (type === "audit_start") {
        major = 2;
        minor = 0;
        patch = 0;
      } else if (type === "major") {
        major += 1;
        minor = 0;
        patch = 0;
      } else {
        minor += 1;
        patch = 0;
      }

      const newVerStr = `v${major}.${minor}.${patch}`;
      const logsToSave = actionsLog.length > 0 ? [...actionsLog] : ["変更なし"];

      const newVersion: EnhancedDocVersion = {
        ver: newVerStr,
        date,
        user,
        action: actionTitle,
        status,
        file: file,
        actionsLog: logsToSave,
        isMajor: type === "major" || type === "audit_start",
        versionId: crypto.randomUUID(),
      };
      return [newVersion, ...prev];
    });
    setActionsLog([]);
    setActiveVerIdx(0);
    setIsHistoryOpen(true);
    setCurrentStatus(status);
  };

  const handleWorkSave = () => {
    createNewVersion({
      type: "minor",
      actionTitle: `作業保存 (${actionsLog.length}件の変更)`,
      status: "fix",
      user: "田中 (担当)",
    });
  };

  const handleRequestReview = () => {
    if (confirm("承認依頼を出しますか？")) {
      createNewVersion({
        type: "minor",
        actionTitle: "承認依頼 (監査待ち)",
        status: "review_pending",
        user: "田中 (担当)",
      });
    }
  };

  const handleStartAudit = () => {
    createNewVersion({
      type: "audit_start",
      actionTitle: "監査開始",
      status: "auditing",
      user: "佐藤 (上司)",
    });
    onAuditStart();
  };

  const handleAuditSuspend = () => {
    createNewVersion({
      type: "minor",
      actionTitle: "監査中断 (一時保存)",
      status: "auditing",
      user: "佐藤 (上司)",
    });
  };

  const handleRemand = () => {
    const reason = prompt("差戻しの理由を入力してください", "修正が必要です");
    if (reason) {
      createNewVersion({
        type: "minor",
        actionTitle: `差戻: ${reason}`,
        status: "rejected",
        user: "佐藤 (上司)",
      });
      onAuditEnd();
    }
  };

  const handleApprove = () => {
    if (confirm("この内容で承認し、次のフローへ進みますか？")) {
      createNewVersion({
        type: "major",
        actionTitle: "承認完了",
        status: "done",
        user: "佐藤 (上司)",
      });
      onAuditEnd();
    }
  };

  return {
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
  };
};
