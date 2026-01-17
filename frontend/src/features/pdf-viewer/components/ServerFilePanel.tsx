"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, RefreshCcw, XCircle } from "lucide-react";

type ServerFileInfo = {
  id: string;
  name: string;
  updated_at: string;
  url: string;
};

type ServerFilePanelProps = {
  onFileSelect: (file: File) => void;
};

export const ServerFilePanel = ({ onFileSelect }: ServerFilePanelProps) => {
  const [files, setFiles] = useState<ServerFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/files");
      if (!response.ok) {
        throw new Error("サーバーからファイル一覧を取得できませんでした。");
      }
      const data = (await response.json()) as ServerFileInfo[];
      setFiles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const handleSelect = async (fileInfo: ServerFileInfo) => {
    try {
      setIsSelecting(fileInfo.id);
      setError(null);
      const response = await fetch(fileInfo.url);
      if (!response.ok) {
        throw new Error("PDFの取得に失敗しました。");
      }
      const blob = await response.blob();
      const file = new File([blob], fileInfo.name, { type: "application/pdf" });
      onFileSelect(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(message);
    } finally {
      setIsSelecting(null);
    }
  };

  return (
    <div className="w-1/2 border-r border-slate-300 bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">サーバーPDF一覧</p>
          <p className="text-xs text-slate-500">左側に表示するPDFを選択してください</p>
        </div>
        <button
          type="button"
          onClick={() => void loadFiles()}
          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-800"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          更新
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-red-500">
          <XCircle className="h-8 w-8" />
          <p className="text-sm text-center px-6">{error}</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
          <FileText className="h-8 w-8" />
          <p className="text-sm">storage フォルダにPDFがありません。</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-slate-200">
            {files.map((fileInfo) => (
              <li key={fileInfo.id}>
                <button
                  type="button"
                  onClick={() => void handleSelect(fileInfo)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-100"
                  disabled={isSelecting === fileInfo.id}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{fileInfo.name}</p>
                      <p className="text-xs text-slate-400">更新: {fileInfo.updated_at}</p>
                    </div>
                  </div>
                  {isSelecting === fileInfo.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
