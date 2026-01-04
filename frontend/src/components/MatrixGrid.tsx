"use client";

import { useDropzone } from "react-dropzone";
import { FileText, CheckCircle, Plus, UploadCloud } from "lucide-react";
import { Client } from "./types";
import { PERIODS } from "./mockData";

interface MatrixGridProps {
  currentClient: Client;
  activePeriodIdx: number;
  activeMode: "year" | "month";
  file: File | null;
  progressPercent: number;
  onFilesDropped: (files: File[]) => void;
  onOpenFile: () => void;
}

export default function MatrixGrid({
  currentClient,
  activePeriodIdx,
  activeMode,
  file,
  progressPercent,
  onFilesDropped,
  onOpenFile,
}: MatrixGridProps) {
  const items =
    activePeriodIdx === 0
      ? ["定款", "履歴事項全部証明書", "株主名簿", "設立届出書"]
      : activeMode === "year"
      ? ["決算報告書", "総勘定元帳", "法人税申告書", "消費税申告書"]
      : ["月次試算表", "通帳コピー", "請求書綴り", "給与台帳"];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesDropped,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: !!file, 
  });

  return (
    <main className="relative flex flex-1 flex-col bg-slate-100 transition-opacity duration-300 select-none">
      <header className="z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-3 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CLIENT</div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                currentClient.fiscal === 3 ? "bg-red-100 text-red-500 border-red-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
              {currentClient.fiscal}月決算
            </span>
          </div>
          <div className="text-xl font-bold leading-tight text-slate-800">
            {activePeriodIdx === 0 ? (
              <span className="text-yellow-500">永久保存ドキュメント</span>
            ) : (
              <span>
                <span className={activeMode === "year" ? "text-blue-600 mr-2" : "text-green-500 mr-2"}>
                  {activeMode === "year" ? PERIODS.year[activePeriodIdx - 1] : PERIODS.month[activePeriodIdx - 1]}
                </span>
                {activeMode === "year" ? "決算資料" : "月次監査"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-brand-600">{progressPercent}%</span>
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90 transform">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
              <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="4" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (125 * progressPercent) / 100} className="transition-all duration-700" />
            </svg>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 fade-in-up">
          {items.map((title, i) => {
            const isStaticUploaded = activePeriodIdx !== 0 && i < 2;
            const isActiveSlot = activePeriodIdx !== 0 && i === 2;
            const uploadedCardClass = "bg-white h-32 rounded-xl border-l-4 border-blue-600 shadow-sm p-4 flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer";

            if (isStaticUploaded) {
              return (
                <div key={i} className={uploadedCardClass}>
                  <div className="flex justify-between items-start">
                    <FileText className="text-blue-600 text-xl" />
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 leading-tight">{title}</div>
                </div>
              );
            }

            if (isActiveSlot && file) {
              return (
                <div key={i} onClick={onOpenFile} className={`${uploadedCardClass} shadow-md ring-2 ring-blue-100`}>
                  <div className="flex justify-between items-start">
                    <FileText className="text-blue-600 text-xl" />
                    <div className="flex items-center gap-1">
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">NEW</span>
                       <CheckCircle className="text-green-500 w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 line-clamp-1">{file.name}</div>
                    <div className="text-sm font-bold text-slate-700 leading-tight">{title}</div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                {...getRootProps()}
                className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-2 transition-colors cursor-pointer group ${
                    isDragActive 
                    ? "bg-blue-50 border-blue-500 scale-105" 
                    : "bg-slate-50 border-slate-300 hover:bg-white hover:border-blue-400"
                }`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                   <>
                     <UploadCloud className="mb-2 h-8 w-8 text-blue-600 animate-bounce" />
                     <div className="text-sm font-black text-blue-600">DROP PDF HERE</div>
                   </>
                ) : (
                   <>
                     <Plus className="text-slate-300 mb-2 group-hover:text-blue-500" />
                     <div className="text-xs font-bold text-slate-400 group-hover:text-blue-500">{title}</div>
                   </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}