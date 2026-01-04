"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadStatus, PdfInfoResponse } from "@/components/types";
import { STAFF_DATA } from "@/components/mockData";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import MatrixGrid from "@/components/MatrixGrid";
import ViewerModal from "@/components/ViewerModal";

export default function DocuGridPage() {
  // --- UI State ---
  const [activeStaffIdx, setActiveStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"year" | "month">("year");
  const [activePeriodIdx, setActivePeriodIdx] = useState(1);

  // --- PDF System State ---
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // --- Context Helpers ---
  const currentStaff = STAFF_DATA[activeStaffIdx];
  const currentClient = currentStaff.clients[activeClientIdx] || {
    fiscal: 3,
    name: "Unknown",
    role: "main",
    id: "unknown",
  };

  // --- API Endpoints ---
  const API_BASE = "http://localhost:3100/api";
  const ENDPOINTS = {
    UPLOAD: `${API_BASE}/pdf/info`,
    HIGHLIGHT: `${API_BASE}/highlight`,
    REORDER: `${API_BASE}/edit/reorder`, // 正しいエンドポイント (/edit/reorder)
  };

  // プレビューURLのメモリ解放用ユーティリティ
  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  // コンポーネント破棄時にURLをクリーンアップ
  useEffect(() => {
    return () => clearPreviewUrl(pdfUrl);
  }, [pdfUrl, clearPreviewUrl]);

  // --- Navigation Handlers ---
  const onStaffChange = (direction: 1 | -1) => {
    setActiveStaffIdx((prev) => {
      let next = prev + direction;
      if (next >= STAFF_DATA.length) next = 0;
      if (next < 0) next = STAFF_DATA.length - 1;
      return next;
    });
    setActiveClientIdx(0);
  };

  // --- PDF Action: Upload ---
  const uploadFile = useCallback(
    async (selectedFile: File) => {
      setUploadStatus("uploading");
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch(ENDPOINTS.UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        // レスポンス解析: バックエンド(snake_case)とフロント(camelCase)の揺らぎを吸収
        const data = await response.json();
        const count = data.page_count ?? data.pageCount;
        
        console.log("PDF Info Response:", data, "Detected Count:", count);

        setPageCount(typeof count === "number" ? count : null);
        setUploadStatus("success");
      } catch (error) {
        console.error("Upload Error:", error);
        setUploadStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    [ENDPOINTS.UPLOAD]
  );

  // --- Event: File Dropped ---
  const onFilesDropped = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      // 1. まず表示を更新（UX向上）
      setFile(selectedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(selectedFile));
      
      // 2. モーダルを開いてバックエンドへアップロード開始
      setIsViewerOpen(true);
      uploadFile(selectedFile);
    },
    [clearPreviewUrl, pdfUrl, uploadFile]
  );

  // --- PDF Action: Highlight / Marker ---
  const handleHighlight = useCallback(
    async (type: "box" | "marker") => {
      if (!file) return;
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        // デモ用に固定座標・ページを指定 (0ページ目に座標(100,100)へ描画)
        formData.append("page", "0");
        formData.append("x", "100");
        formData.append("y", "100");
        formData.append("width", "200");
        formData.append("height", "100");
        formData.append("type", type); // バックエンド識別用 ('box' or 'marker')

        const response = await fetch(ENDPOINTS.HIGHLIGHT, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`${type} action failed`);

        // 加工されたPDF(Blob)を受け取る
        const blob = await response.blob();
        const updatedFile = new File([blob], `processed_${file.name}`, {
          type: blob.type || "application/pdf",
        });

        // 画面とファイルを更新
        setFile(updatedFile);
        clearPreviewUrl(pdfUrl);
        setPdfUrl(URL.createObjectURL(updatedFile));

        return updatedFile; // 成功したファイルを返す（履歴追加用）
      } catch (error) {
        console.error("Highlight Error:", error);
        alert(`${type === "box" ? "赤枠" : "マーカー"}処理に失敗しました。`);
      } finally {
        setIsLoading(false);
      }
    },
    [file, pdfUrl, clearPreviewUrl, ENDPOINTS.HIGHLIGHT]
  );

  // --- PDF Action: Reorder ---
  const handleReorder = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // ページ並べ替え指示の作成 (逆順にするデモ)
      // 重要: バックエンドは0始まりのインデックスを期待しているため、(count - 1) から開始する
      const count = pageCount || 1; 
      const orderStr = Array.from({length: count}, (_, i) => (count - 1) - i).join(",");
      
      console.log("Requesting Reorder with (0-based):", orderStr);
      formData.append("order", orderStr);

      const response = await fetch(ENDPOINTS.REORDER, {
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
      console.error("Reorder Error:", error);
      alert("並べ替え処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl, ENDPOINTS.REORDER, pageCount]);

  // 進捗率の計算ロジック（デモ用）
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