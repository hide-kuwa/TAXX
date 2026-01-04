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
    fiscal: 3, name: "Unknown", role: "main", id: "unknown",
  };

  const API_BASE = "http://localhost:3100/api";
  const ENDPOINTS = {
    UPLOAD: `${API_BASE}/pdf/info`,
    HIGHLIGHT: `${API_BASE}/highlight`,
    REORDER: `${API_BASE}/edit/reorder`,
    MERGE: `${API_BASE}/edit/merge`, // 追加
    THUMBNAILS: `${API_BASE}/pdf/thumbnails`,
  };

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => clearPreviewUrl(pdfUrl);
  }, [pdfUrl, clearPreviewUrl]);

  const onStaffChange = (direction: 1 | -1) => {
    setActiveStaffIdx((prev) => {
      let next = prev + direction;
      if (next >= STAFF_DATA.length) next = 0;
      if (next < 0) next = STAFF_DATA.length - 1;
      return next;
    });
    setActiveClientIdx(0);
  };

  const uploadFile = useCallback(async (selectedFile: File) => {
    setUploadStatus("uploading");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(ENDPOINTS.UPLOAD, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      const count = data.page_count ?? data.pageCount;
      setPageCount(typeof count === "number" ? count : null);
      setUploadStatus("success");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [ENDPOINTS.UPLOAD]);

  const onFilesDropped = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    clearPreviewUrl(pdfUrl);
    setPdfUrl(URL.createObjectURL(selectedFile));
    setIsViewerOpen(true);
    uploadFile(selectedFile);
  }, [clearPreviewUrl, pdfUrl, uploadFile]);

  const handleHighlight = useCallback(async (type: "box" | "marker") => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("page", "0");
      formData.append("x", "100");
      formData.append("y", "100");
      formData.append("width", "200");
      formData.append("height", "100");
      formData.append("type", type);
      const response = await fetch(ENDPOINTS.HIGHLIGHT, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`${type} action failed`);
      const blob = await response.blob();
      const updatedFile = new File([blob], `processed_${file.name}`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
      return updatedFile;
    } catch (error) {
      alert(`${type === "box" ? "赤枠" : "マーカー"}処理に失敗しました。`);
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl, ENDPOINTS.HIGHLIGHT]);

  const handleReorder = useCallback(async (newOrderIndices: number[]) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const orderStr = newOrderIndices.join(",");
      formData.append("order", orderStr);
      const response = await fetch(ENDPOINTS.REORDER, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Reorder failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `reordered_${file.name}`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
      return updatedFile;
    } catch (error) {
      alert("並べ替え処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl, ENDPOINTS.REORDER]);

  // --- ★追加: 結合処理 ---
  const handleMerge = useCallback(async (filesToMerge: File[]) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      filesToMerge.forEach(f => formData.append("files", f));

      const response = await fetch(ENDPOINTS.MERGE, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Merge failed");
      
      const blob = await response.blob();
      const updatedFile = new File([blob], `merged.pdf`, { type: blob.type || "application/pdf" });

      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));

      // ページ数更新のためにinfoを叩き直すのが確実だが、ここでは省略してFile更新のみ
      // 次のレンダリングでuploadFile相当のことをするか、ViewerModalが検知してサムネイル更新する
      // ViewerModal側でサムネイル更新ロジックが走るためOK

      // ページ数は本来サーバーから返すべきだが、デモ簡易実装として後続のサムネイル取得で合致させる
      
      return updatedFile;
    } catch (error) {
      console.error("Merge Error:", error);
      alert("結合処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [pdfUrl, clearPreviewUrl, ENDPOINTS.MERGE]);

  const handleGetThumbnails = useCallback(async () => {
    if (!file) return [];
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(ENDPOINTS.THUMBNAILS, { method: "POST", body: formData });
      if (!response.ok) return [];
      const data = await response.json();
      // サムネイル数から正確なページ数を逆算して更新 (整合性確保)
      if (data.thumbnails && data.thumbnails.length > 0) {
        setPageCount(data.thumbnails.length);
      }
      return data.thumbnails as string[];
    } catch (error) {
      return [];
    }
  }, [file, ENDPOINTS.THUMBNAILS]);

  const progressPercent = activePeriodIdx === 0 ? 100 : file ? 50 : 0;

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-600 overflow-hidden font-sans select-none">
      <NavBar currentStaff={currentStaff} activeClientIdx={activeClientIdx} onClientChange={setActiveClientIdx} onStaffChange={onStaffChange} onStaffSwitch={() => onStaffChange(1)} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar activeMode={activeMode} activePeriodIdx={activePeriodIdx} onPeriodChange={setActivePeriodIdx} onModeSwitch={() => { setActiveMode((prev) => (prev === "year" ? "month" : "year")); setActivePeriodIdx(1); }} />
        <MatrixGrid currentClient={currentClient} activePeriodIdx={activePeriodIdx} activeMode={activeMode} file={file} progressPercent={progressPercent} onFilesDropped={onFilesDropped} onOpenFile={() => setIsViewerOpen(true)} />
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
          onMerge={handleMerge} // ★追加
          onGetThumbnails={handleGetThumbnails}
        />
      </div>
    </div>
  );
}