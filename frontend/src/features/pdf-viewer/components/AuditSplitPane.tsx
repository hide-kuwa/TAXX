"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Database, FilePlus2, RefreshCcw, Upload } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";
import { AuditCheckPoint, AuditSide, ToolType } from "../types";
import { PDFPaneHeader } from "./PDFPaneHeader";
import { ServerFilePanel } from "./ServerFilePanel";

type AuditSplitPaneProps = {
  side: AuditSide;
  title: string;
  file: File | null;
  workingFile: File | null;
  onFileChange: (file: File | null) => void;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
  markers: AuditCheckPoint[];
  onCheckPoint: (side: AuditSide, point: Omit<AuditCheckPoint, "side">) => void;
  activeTool: ToolType;
};

export const AuditSplitPane = ({
  side,
  title,
  file,
  workingFile,
  onFileChange,
  onRenderPage,
  markers,
  onCheckPoint,
  activeTool,
}: AuditSplitPaneProps) => {
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDropReference = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target.files?.[0];
    if (target) {
      onFileChange(target);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
    onDropReference(dropped);
  };

  useEffect(() => {
    setPageIndex(0);
  }, [file]);

  useEffect(() => {
    let mounted = true;
    const loadInfo = async () => {
      if (!file) {
        setPageCount(0);
        return;
      }
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(API_ENDPOINTS.UPLOAD, { method: "POST", body: form });
        const data = await res.json();
        if (mounted) {
          setPageCount(data.page_count ?? data.pageCount ?? 0);
        }
      } catch {
        if (mounted) setPageCount(0);
      }
    };
    void loadInfo();
    return () => {
      mounted = false;
    };
  }, [file]);

  useEffect(() => {
    let mounted = true;
    const loadPageImage = async () => {
      if (!file) {
        setPageImage(null);
        return;
      }
      const image = await onRenderPage(pageIndex, file);
      if (mounted) {
        setPageImage(image);
      }
    };
    void loadPageImage();
    return () => {
      mounted = false;
    };
  }, [file, pageIndex, onRenderPage]);

  const canPrev = pageIndex > 0;
  const canNext = pageCount > 0 && pageIndex < pageCount - 1;

  const handleClearReference = () => {
    onFileChange(null);
  };

  const handleUseWorkingFile = () => {
    if (workingFile) {
      onFileChange(workingFile);
    }
  };

  const handlePaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "check" || !file) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onCheckPoint(side, { page: pageIndex, x, y, fileName: file.name });
  };

  const markersOnPage = useMemo(
    () => markers.filter((m) => m.page === pageIndex),
    [markers, pageIndex]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-1/2 border-r border-slate-300 bg-slate-200 relative flex flex-col transition-colors ${
        isDragActive ? "bg-blue-100 ring-inset ring-4 ring-blue-400" : ""
      }`}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileInput}
        className="absolute left-3 top-14 z-20 w-[180px] text-[11px] text-slate-500 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-[11px] file:text-slate-700"
      />
      <PDFPaneHeader
        title={title}
        fileName={file?.name}
        onOpen={handleClearReference}
        onClose={handleClearReference}
      />
      <div className="flex items-center justify-between gap-2 border-b border-slate-300 bg-slate-100 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUseWorkingFile}
            disabled={!workingFile}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-40"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            作業中を表示
          </button>
          <button
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <Database className="h-3.5 w-3.5" />
            保存済を選択
          </button>
        </div>
        <div className="text-xs text-slate-600">
          {pageCount > 0 ? `${pageIndex + 1} / ${pageCount}` : "- / -"}
        </div>
      </div>

      {isPickerOpen && (
        <div className="h-64 border-b border-slate-300 bg-white">
          <ServerFilePanel
            onFileSelect={(picked) => {
              onFileChange(picked);
              setIsPickerOpen(false);
            }}
          />
        </div>
      )}

      {file ? (
        <div className="flex-1 bg-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
            <button
              type="button"
              onClick={() => canPrev && setPageIndex((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="rounded p-1 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{pageCount > 0 ? `${pageIndex + 1} / ${pageCount}` : "- / -"}</span>
            <button
              type="button"
              onClick={() => canNext && setPageIndex((p) => p + 1)}
              disabled={!canNext}
              className="rounded p-1 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div
            className="relative shadow-2xl bg-white"
            onClick={handlePaneClick}
            style={{ cursor: activeTool === "check" ? "copy" : "default" }}
          >
            {pageImage ? (
              <img src={pageImage} className="max-h-[80vh] w-auto pointer-events-none" />
            ) : (
              <div className="h-[80vh] w-[50vh] flex items-center justify-center text-slate-500">Loading...</div>
            )}
            {markersOnPage.map((marker, idx) => (
              <div
                key={`${side}-marker-${idx}-${marker.x}-${marker.y}`}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow"
                style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
              />
            ))}
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
              {activeTool === "check" ? "チェック対応点をクリック" : "参照表示"}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Upload className="h-12 w-12 mb-2 opacity-50" />
          <p className="font-bold">PDFをセットしてください</p>
          <p className="text-xs">Drag & Drop / 作業中 / 保存済選択</p>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <FilePlus2 className="h-4 w-4" />
            どちら側でも元資料として利用できます
          </div>
        </div>
      )}

      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm z-20">
          <p className="text-white font-bold text-xl drop-shadow-md">Drop Reference PDF Here</p>
        </div>
      )}
    </div>
  );
};
