"use client";

import {
  ArrowLeft,
  PenTool,
  History,
  Columns,
  Check,
  File as FileIcon,
  MessageCircle,
} from "lucide-react";
import { UploadStatus } from "./types";

interface ViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  pdfUrl: string | null;
  pageCount: number | null;
  uploadStatus: UploadStatus;
  isLoading: boolean;
  onHighlight: () => void;
}

export default function ViewerModal({
  isOpen,
  onClose,
  file,
  pdfUrl,
  pageCount,
  uploadStatus,
  isLoading,
  onHighlight,
}: ViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none">
      <div className="relative flex h-full flex-1 flex-col">
        <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 戻る
            </button>
            <div className="h-6 w-px bg-slate-600"></div>
            <h2 className="text-sm font-bold text-white">{file ? file.name : "Document"}</h2>
            <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
              v6.0 最新版 (申告済)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="mr-2 flex items-center gap-1 text-[10px] text-slate-400">
              <PenTool className="h-3 w-3" /> Click to Verify
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-slate-600">
              <History className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-blue-600">
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={onHighlight}
              disabled={isLoading}
              className="flex items-center rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? (
                "処理中..."
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" /> 完了
                </>
              )}
            </button>
          </div>
        </header>
        <div className="relative flex flex-1 overflow-hidden">
          <div className="relative flex-1 border-r border-slate-300 bg-slate-100">
            {pdfUrl ? (
              <embed src={pdfUrl} type="application/pdf" className="h-full w-full" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="text-center">
                  <FileIcon className="h-32 w-32 mx-auto" />
                  <p className="mt-4 text-4xl font-black">MAIN DOC</p>
                </div>
              </div>
            )}
            {pageCount !== null && (
              <div className="absolute top-10 left-10 max-w-xs transform rotate-1 rounded-xl border border-yellow-200 bg-yellow-100 p-4 text-yellow-800 shadow-lg">
                <div className="mb-1 text-xs font-bold flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> System Info
                </div>
                <p className="text-sm font-bold">
                  Page Count: {pageCount} <br /> Status: {uploadStatus}
                </p>
              </div>
            )}
          </div>
          <div className="relative w-0 overflow-hidden bg-slate-200 transition-all duration-300">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center text-slate-400">
              <p className="text-sm font-bold">比較する書類を選択</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
