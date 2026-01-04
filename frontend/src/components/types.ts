export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type Client = {
  id: string;
  name: string;
  fiscal: number;
  role: "main" | "sub";
};

export type Staff = {
  id: string;
  name: string;
  clients: Client[];
};

export type PdfInfoResponse = {
  pageCount?: number;
  page_count?: number;
  fileId?: string;
  id?: string;
};

export type DocVersion = {
  ver: string;
  date: string;
  user: string;
  action: string;
  status: "done" | "clean" | "check" | "fix" | "draft";
  comment?: string;
  file?: File;
};
