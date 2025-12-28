"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Highlighter, Save, Eye, Pencil } from "lucide-react";

const uploadEndpoint = "http://localhost:3100/api/pdf/info";
const highlightEndpoint = "http://localhost:3100/api/highlight";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type PdfInfoResponse = {
  pageCount?: number;
  fileId?: string;
  id?: string;
};

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  const fileName = useMemo(() => currentFile?.name ?? "No file selected", [currentFile]);

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setUploadStatus("uploading");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = (await response.json()) as PdfInfoResponse;
      setPageCount(typeof data.pageCount === "number" ? data.pageCount : null);
      setFileId(data.fileId ?? data.id ?? null);
      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      setCurrentFile(selectedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(selectedFile));
      uploadFile(selectedFile);
    },
    [clearPreviewUrl, pdfUrl, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleHighlight = useCallback(async () => {
    if (!currentFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", currentFile);
      // デモ用に固定値を送信 (実際はUIで指定した座標を送る)
      formData.append("page", "0");
      formData.append("x", "100");
      formData.append("y", "100");
      formData.append("width", "200");
      formData.append("height", "100");

      const response = await fetch(highlightEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Highlight failed");
      }

      // サーバーから返ってきた加工済みPDF（Blob）を受け取る
      const blob = await response.blob();
      const updatedFile = new File([blob], `processed_${currentFile.name}`, { type: blob.type || "application/pdf" });

      // プレビューを更新して加工結果を表示
      setCurrentFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
    } catch (error) {
      console.error("Highlight error:", error);
      alert("Highlight failed. Check backend console.");
    } finally {
      setIsLoading(false);
    }
  }, [clearPreviewUrl, currentFile, pdfUrl]);

  useEffect(() => {
    return () => {
      clearPreviewUrl(pdfUrl);
    };
  }, [clearPreviewUrl, pdfUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 text-slate-900">
      {/* --- Header Area --- */}
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
              <FileText className="h-5 w-5 text-slate-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active File</p>
              <p className="text-lg font-semibold text-white">{fileName}</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 rounded-full bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode("view")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "view" ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "edit" ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200">
              Pages: <span className="font-semibold text-white">{pageCount ?? "—"}</span>
            </div>
            {/* Highlight Button: Connects to Backend API */}
            <button
              type="button"
              onClick={handleHighlight}
              disabled={!currentFile || isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <Highlighter className="h-4 w-4" />
              Highlight
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        {!currentFile && (
          <div
            {...getRootProps()}
            className={`flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-10 text-center shadow-sm transition ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-800">Drag & drop your PDF</h2>
            <p className="mt-2 text-sm text-slate-500">
              Upload a PDF to preview and run highlight operations from the toolbar above.
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
              Select File
            </span>
          </div>
        )}

        {currentFile && (
          <div className="flex w-full flex-1 items-center justify-center">
            <div className="relative w-full max-w-4xl">
              <div className="absolute -inset-4 rounded-3xl bg-white/60 shadow-2xl"></div>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {/* PDF Preview: Uses native <embed> for stability */}
                {pdfUrl ? (
                  <embed
                    src={pdfUrl}
                    type="application/pdf"
                    className="h-[720px] w-full bg-gray-50"
                  />
                ) : (
                  <div className="flex h-[720px] items-center justify-center text-sm text-slate-400">
                    PDF preview will appear here.
                  </div>
                )}
                {/* Loading Spinner Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}