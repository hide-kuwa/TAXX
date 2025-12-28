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
  fileId?: string;
  id?: string;
};
