"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const uploadEndpoint = "http://localhost:3100/api/pdf/info";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setUploadStatus("uploading");
    setPageCount(null);

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

      const data = (await response.json()) as { pageCount?: number };
      setPageCount(typeof data.pageCount === "number" ? data.pageCount : null);
      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
      uploadFile(selectedFile);
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">TAXX Engine</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Upload PDF</h2>
          <p className="mt-2 text-sm text-slate-500">
            Drop your PDF here to send it to the backend and preview instantly.
          </p>

          <div
            {...getRootProps()}
            className={`mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? "Drop the PDF here" : "Drag & drop a PDF, or click to select"}
            </p>
            <p className="mt-2 text-xs text-slate-400">Only .pdf files are supported.</p>
          </div>

          {file && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Status:</span> {uploadStatus}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                <span className="font-medium">Page Count:</span>{" "}
                {pageCount ?? "—"}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Preview</h2>
          <div className="mt-6 min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {pdfUrl ? (
              <embed
                src={pdfUrl}
                type="application/pdf"
                className="h-full min-h-[600px] w-full"
              />
            ) : (
              <div className="flex h-full min-h-[600px] items-center justify-center text-sm text-slate-400">
                Upload a PDF to preview it here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
