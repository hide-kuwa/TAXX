export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type WorkflowStatus = "draft" | "review_pending" | "auditing" | "done" | "rejected" | "fix";

export type DocVersion = {
  ver: string;
  date: string;
  user: string;
  action: string;
  status: WorkflowStatus;
  comment?: string;
  file?: File;
};

export type ToolType = "none" | "marker" | "box" | "line" | "check";

export type AuditTarget = "primary" | "reference";
export type AuditSide = "left" | "right";

export type AuditCheckPoint = {
  side: AuditSide;
  page: number;
  x: number;
  y: number;
  fileName?: string;
  fileHash?: string;
};

export type AuditCheckLink = {
  id: string;
  createdAt: string;
  createdBy?: string;
  left: AuditCheckPoint;
  right: AuditCheckPoint;
};

export interface EnhancedDocVersion extends Omit<DocVersion, "status"> {
  status: WorkflowStatus;
  actionsLog: string[];
  isMajor: boolean;
  versionId: string;
}

export interface ViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  pdfUrl: string | null;
  pageCount: number | null;
  uploadStatus: UploadStatus;
  isLoading: boolean;
  onHighlight: (
    type: "box" | "marker" | "line" | "check",
    page: number,
    rect: { x: number; y: number; w: number; h: number },
    options?: { file?: File; updatePrimary?: boolean }
  ) => Promise<File | void>;
  onReorder: (newOrder: number[]) => Promise<File | void>;
  onMerge: (files: File[]) => Promise<File | void>;
  onGetThumbnails: () => Promise<string[]>;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
  canAnnotate?: boolean;
  canApprove?: boolean;
}

export const INITIAL_HISTORY: EnhancedDocVersion[] = [
  {
    ver: "v1.0.0",
    date: "2024/05/15 11:00",
    user: "田中 (担当)",
    action: "初版アップロード",
    status: "draft",
    isMajor: true,
    versionId: "initial",
    actionsLog: ["ファイルアップロード"],
  },
];
