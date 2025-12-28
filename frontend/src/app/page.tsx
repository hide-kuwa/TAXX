"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadStatus, PdfInfoResponse } from "@/components/types";
import { STAFF_DATA } from "@/components/mockData";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import MatrixGrid from "@/components/MatrixGrid";
import ViewerModal from "@/components/ViewerModal";

export default function DocuGridPage() {
  const [activeStaffIdx, setActiveStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"year" | "month">("year");
  const [activePeriodIdx, setActivePeriodIdx] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const currentStaff = STAFF_DATA[activeStaffIdx];
  const currentClient = currentStaff.clients[activeClientIdx] || {
    fiscal: 3,
    name: "Unknown",
    role: "main",
    id: "unknown",
  };

  const uploadEndpoint = "http://localhost:3100/api/pdf/info";
  const highlightEndpoint = "http://localhost:3100/api/highlight";
  const reorderEndpoint = "http://localhost:3100/api/edit/reorder";

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const onStaffChange = (direction: 1 | -1) => {
    setActiveStaffIdx((prev) => {
      let next = prev + direction;
      if (next >= STAFF_DATA.length) next = 0;
      if (next < 0) next = STAFF_DATA.length - 1;
      return next;
    });
    setActiveClientIdx(0);
  };

  const uploadFile = useCallback(
    async (selectedFile: File) => {
      setUploadStatus("uploading");
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = (await response.json()) as PdfInfoResponse;
        setPageCount(typeof data.pageCount === "number" ? data.pageCount : null);
        setUploadStatus("success");
      } catch (error) {
        setUploadStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    [uploadEndpoint]
  );

  const onFilesDropped = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;
      setFile(selectedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setIsViewerOpen(true);
      uploadFile(selectedFile);
    },
    [clearPreviewUrl, pdfUrl, uploadFile]
  );

  const handleHighlight = useCallback(
    async (type: "box" | "marker") => {
      if (!file) return;
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("page", "0");
        formData.append(
          "rect",
          JSON.stringify({ x: 100, y: 100, width: 200, height: 100 })
        );
        formData.append("type", type);

        const response = await fetch(highlightEndpoint, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Highlight failed");
        const blob = await response.blob();
        const updatedFile = new File([blob], `processed_${file.name}`, {
          type: blob.type || "application/pdf",
        });

        setFile(updatedFile);
        clearPreviewUrl(pdfUrl);
        setPdfUrl(URL.createObjectURL(updatedFile));

        return updatedFile;
      } catch (error) {
        console.error(error);
        alert("処理失敗: バックエンドが応答しませんでした");
      } finally {
        setIsLoading(false);
      }
    },
    [file, pdfUrl, clearPreviewUrl, highlightEndpoint]
  );

  const handleReorder = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("order", "reverse");

      const response = await fetch(reorderEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Reorder failed");

      const blob = await response.blob();
      const updatedFile = new File([blob], `reordered_${file.name}`, {
        type: blob.type || "application/pdf",
      });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));

      return updatedFile;
    } catch (error) {
      console.error(error);
      alert("並べ替え処理失敗");
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl, reorderEndpoint]);

  useEffect(() => {
    return () => clearPreviewUrl(pdfUrl);
  }, [pdfUrl, clearPreviewUrl]);

  const progressPercent = activePeriodIdx === 0 ? 100 : file ? 50 : 0;

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-600 overflow-hidden font-sans select-none">
      <NavBar
        currentStaff={currentStaff}
        activeClientIdx={activeClientIdx}
        onClientChange={setActiveClientIdx}
        onStaffChange={onStaffChange}
        onStaffSwitch={() => onStaffChange(1)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          activeMode={activeMode}
          activePeriodIdx={activePeriodIdx}
          onPeriodChange={setActivePeriodIdx}
          onModeSwitch={() => {
            setActiveMode((prev) => (prev === "year" ? "month" : "year"));
            setActivePeriodIdx(1);
          }}
        />

        <MatrixGrid
          currentClient={currentClient}
          activePeriodIdx={activePeriodIdx}
          activeMode={activeMode}
          file={file}
          progressPercent={progressPercent}
          onFilesDropped={onFilesDropped}
          onOpenFile={() => setIsViewerOpen(true)}
        />

        <ViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          file={file}
          pdfUrl={pdfUrl}
          pageCount={pageCount}
          uploadStatus={uploadStatus}
          isLoading={isLoading}
          onHighlight={handleHighlight}
          onReorder={handleReorder}
        />
      </div>
    </div>
  );
}
