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
  // グリッド項目の決定
  const items =
    activePeriodIdx === 0
      ? ["定款", "履歴事項全部証明書", "株主名簿", "設立届出書"]
      : activeMode === "year"
      ? ["決算報告書", "総勘定元帳", "法人税申告書", "消費税申告書"]
      : ["月次試算表", "通帳コピー", "請求書綴り", "給与台帳"];

  // ドロップゾーンの設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesDropped,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: !!file, // ファイルがあるときはクリックでアップロードダイアログを開かない（個別ボタンで開くため）
  });

  return (
    <main className="relative flex flex-1 flex-col bg-slate-100 transition-opacity duration-300 select-none">
      <header className="z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-3 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CLIENT</div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                currentClient.fiscal === 3
                  ? "bg-red-100 text-red-500 border-red-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
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
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#3b82f6"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="125"
                strokeDashoffset={125 - (125 * progressPercent) / 100}
                className="transition-all duration-700"
              />
            </svg>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 fade-in-up">
          {items.map((title, i) => {
            // 条件設定
            // 1. アップロード済み扱い（デモ用: 最初の2つ）
            const isStaticUploaded = activePeriodIdx !== 0 && i < 2;

            // 2. ターゲットスロット（デモ用: 「消費税申告書」のボックスをターゲットにする）
            // "消費税申告書" という文字列が含まれる、または特定のインデックスの場合
            const isTargetSlot = title.includes("消費税申告書");

            // --- A. 既にアップロード済みのファイル（静的表示） ---
            if (isStaticUploaded)
              return (
                <div
                  key={i}
                  className="flex h-32 cursor-pointer flex-col justify-between rounded-xl border-l-4 border-blue-600 bg-white p-4 shadow-sm transition-transform hover:scale-105"
                >
                  <div className="flex items-start justify-between">
                    <FileText className="text-xl text-blue-600" />
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold leading-tight text-slate-700">{title}</div>
                </div>
              );

            // --- B. ドロップ対象のボックス（消費税申告書） ---
            if (isTargetSlot) {
              // ファイルがアップロードされた後の表示
              if (file) {
                return (
                  <div
                    key={i}
                    onClick={onOpenFile}
                    className="group flex h-32 cursor-pointer flex-col justify-between rounded-xl border-l-4 border-blue-600 bg-white p-4 shadow-md transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <FileText className="text-xl text-blue-600" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">NEW</span>
                        <CheckCircle className="text-green-500 w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 line-clamp-1">{file.name}</div>
                      <div className="text-sm font-bold leading-tight text-slate-700">{title}</div>
                    </div>
                    <div className="text-[10px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      CLICK TO OPEN
                    </div>
                  </div>
                );
              }

              // ファイル未アップロード時（ここがドロップゾーン）
              return (
                <div
                  key={i}
                  {...getRootProps()}
                  className={`group flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-2 text-center transition-all duration-300 
                    ${isDragActive 
                        ? "border-blue-500 bg-blue-50 scale-105 shadow-xl ring-4 ring-blue-200" // ドラッグ中のスタイル
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-white"
                    }`}
                >
                  <input {...getInputProps()} />

                  {isDragActive ? (
                    // ドラッグして重ねたときの表示
                    <>
                      <UploadCloud className="mb-2 h-8 w-8 text-blue-600 animate-bounce" />
                      <div className="text-sm font-black text-blue-600">ここにドロップ！</div>
                    </>
                  ) : (
                    // 通常時の表示
                    <>
                      <Plus className="mb-2 text-slate-300 group-hover:text-blue-500" />
                      <div className="text-xs font-bold text-slate-400 group-hover:text-blue-500">{title}</div>
                      <div className="mt-1 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        UPLOAD PDF
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // --- C. その他の空きスロット（ドロップ不可） ---
            return (
              <div
                key={i}
                className="group flex h-32 cursor-not-allowed flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 text-center opacity-60"
              >
                <div className="text-xs font-bold text-slate-400">{title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
