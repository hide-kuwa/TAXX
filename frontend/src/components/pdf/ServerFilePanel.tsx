"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, DownloadCloud, AlertCircle, RefreshCcw } from "lucide-react";

interface ApiFile {
  id: string;
  name: string;
  updated_at: string;
  url: string;
}

interface ServerFilePanelProps {
  onFileSelect: (file: File) => void;
}

export const ServerFilePanel = ({ onFileSelect }: ServerFilePanelProps) => {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/files");
      if (!res.ok) throw new Error("サーバー接続エラー");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
      setError("ファイル一覧を取得できませんでした");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSelect = async (apiFile: ApiFile) => {
    try {
      setLoading(true);
      const res = await fetch(apiFile.url);
      if (!res.ok) throw new Error("ダウンロード失敗");
      const blob = await res.blob();
      const fileObj = new File([blob], apiFile.name, { type: "application/pdf" });
      onFileSelect(fileObj);
    } catch (err) {
      alert("ファイルの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border-r border-slate-300">
      <div className="h-12 flex items-center justify-between px-3 bg-white border-b border-slate-200 shrink-0">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-blue-500" />
          サーバーファイル選択
        </span>
        <button
          onClick={fetchList}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-500 transition-colors"
          title="更新"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-500 text-xs rounded border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs">
            storageフォルダに<br />PDFファイルがありません
          </div>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => handleSelect(file)}
            className="group flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="p-2 bg-slate-100 rounded-md group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-700">
                {file.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{file.updated_at}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
