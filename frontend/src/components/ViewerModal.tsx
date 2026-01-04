"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  History,
  Columns,
  Check,
  File as FileIcon,
  MessageCircle,
  X,
  ArrowUpDown,
  Highlighter,
  Square,
  AlertCircle,
} from "lucide-react";
import { DocVersion, UploadStatus } from "./types";

interface ViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  pdfUrl: string | null;
  pageCount: number | null;
  uploadStatus: UploadStatus;
  isLoading: boolean;
  onHighlight: (type: "box" | "marker") => Promise<File | void>;
  onReorder: () => Promise<File | void>;
}

const INITIAL_HISTORY: DocVersion[] = [
  {
    ver: "v1.0",
    date: "2024/05/15 11:00",
    user: "田中 (担当)",
    action: "初版アップロード",
    status: "draft",
    // file: undefined // 初期モックデータにはファイル実体がない
  },
];

export default function ViewerModal({
  isOpen,
  onClose,
  file,
  pdfUrl,
  pageCount,
  uploadStatus,
  isLoading,
  onHighlight,
  onReorder,
}: ViewerModalProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<DocVersion[]>(INITIAL_HISTORY);
  const [activeVerIdx, setActiveVerIdx] = useState(0);

  // 表示用のURLを管理するState
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // モーダルが開いたとき、または最新のPDF(pdfUrl)が更新されたときの処理
  useEffect(() => {
    if (isOpen && pdfUrl) {
      // 最新のPDFを表示
      setPreviewUrl(pdfUrl);
      setActiveVerIdx(0);
      
      // 最新の履歴エントリを更新（現在表示中のファイルを紐付ける）
      setHistory(prev => {
        const newHistory = [...prev];
        // まだ履歴がない、または最新がドラフトの場合の調整ロジックがあればここに記述
        return newHistory;
      });
    }
  }, [isOpen, pdfUrl]);

  // 履歴（バージョン）を選択したときの処理
  useEffect(() => {
    // インデックス0（最新）の場合は、親から渡されたpdfUrlを使う
    if (activeVerIdx === 0) {
      setPreviewUrl(pdfUrl);
      return;
    }

    // 過去のバージョンの場合、そのバージョンが持っているFileからURLを生成
    const targetVer = history[activeVerIdx];
    if (targetVer && targetVer.file) {
      const url = URL.createObjectURL(targetVer.file);
      setPreviewUrl(url);
      
      // クリーンアップ関数
      return () => URL.revokeObjectURL(url);
    } else {
      // ファイル実体がない場合（モックデータなど）
      setPreviewUrl(null);
    }
  }, [activeVerIdx, history, pdfUrl]);


  const handleEditAction = async (actionType: "box" | "marker" | "reorder") => {
    if (!file) return;

    let newFile: File | void;
    let actionName = "";

    if (actionType === "reorder") {
      newFile = await onReorder();
      actionName = "ページ並べ替え";
    } else {
      newFile = await onHighlight(actionType);
      actionName = actionType === "box" ? "赤枠追加" : "マーカー追加";
    }

    if (newFile) {
      const date = new Date().toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      // 新しいバージョンを履歴の先頭に追加
      setHistory((prev) => {
        // バージョン番号を採番 (v{len}.0)
        const nextVerNum = prev.length + 1; 
        
        const newVersion: DocVersion = {
          ver: `v${nextVerNum}.0`,
          date,
          user: "田中 (担当)",
          action: actionName,
          status: "fix",
          file: newFile as File, // 型アサーション
        };
        return [newVersion, ...prev];
      });

      // 最新（0番目）を選択状態にする
      setActiveVerIdx(0);
      setIsHistoryOpen(true);
    }
  };

  if (!isOpen) return null;

  // 現在選択中のバージョン情報
  const activeVersion = history[activeVerIdx] || { ver: "---", action: "", status: "draft" };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95 select-none overflow-hidden">
      <div
        className="relative flex h-full flex-1 flex-col transition-all duration-300"
        style={{ marginRight: isHistoryOpen ? "300px" : "0" }}
      >
        <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 戻る
            </button>
            <div className="h-6 w-px bg-slate-600"></div>
            <h2 className="text-sm font-bold text-white max-w-[200px] truncate">
              {file ? file.name : "Document"}
            </h2>
            
            {/* バージョンバッジ */}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                activeVersion.status === "done"
                  ? "bg-green-600"
                  : activeVersion.status === "fix"
                    ? "bg-blue-600"
                    : "bg-slate-600"
              }`}
            >
              {activeVersion.ver} {activeVersion.action}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 rounded-lg p-1 mr-2 border border-slate-700">
              <button
                onClick={() => handleEditAction("marker")}
                disabled={isLoading}
                className="p-1.5 text-yellow-400 hover:bg-slate-700 rounded transition-colors"
                title="マーカー (黄色)"
              >
                <Highlighter className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEditAction("box")}
                disabled={isLoading}
                className="p-1.5 text-red-500 hover:bg-slate-700 rounded transition-colors"
                title="赤枠"
              >
                <Square className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEditAction("reorder")}
                disabled={isLoading}
                className="p-1.5 text-blue-400 hover:bg-slate-700 rounded transition-colors"
                title="並べ替え (逆順)"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 transition-colors ${
                isHistoryOpen
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              <History className="h-4 w-4" />
            </button>

            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-blue-600">
              <Columns className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="flex items-center rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-green-500"
            >
              <Check className="mr-1 h-3 w-3" /> 完了
            </button>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <div className="relative flex-1 bg-slate-100">
            {/* プレビュー表示エリア */}
            {previewUrl ? (
              // keyにpreviewUrlを指定することで、URL変更時に確実に再レンダリングさせる
              <embed key={previewUrl} src={previewUrl} type="application/pdf" className="h-full w-full" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                <div className="text-center text-slate-400">
                  {activeVerIdx === 0 && !file ? (
                    <>
                       <FileIcon className="h-32 w-32 mx-auto mb-4" />
                       <p className="text-2xl font-bold">No Preview Available</p>
                    </>
                  ) : (
                    <>
                       <AlertCircle className="h-24 w-24 mx-auto mb-4 text-slate-300" />
                       <p className="text-xl font-bold">過去データのプレビューはありません</p>
                       <p className="text-sm">(モックデータのためファイル実体がありません)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {pageCount !== null && (
              <div className="absolute top-4 left-4 max-w-xs transform rounded-xl border border-blue-100 bg-white/90 p-3 text-slate-800 shadow-lg backdrop-blur">
                <div className="mb-1 text-xs font-bold flex items-center gap-1 text-blue-600">
                  <MessageCircle className="h-3 w-3" /> Info
                </div>
                <p className="text-[10px] font-bold">
                  Pages: {pageCount}
                  <br />
                  Displaying: {activeVersion.ver}
                </p>
                <p className="text-[10px] text-slate-500">Status: {uploadStatus}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 right-0 h-full bg-slate-800 border-l border-slate-700 transition-transform duration-300 z-30 w-[300px] flex flex-col shadow-2xl ${
          isHistoryOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 h-14">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Version History</span>
          <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute top-0 bottom-0 left-[29px] w-[2px] bg-slate-700 z-0"></div>

          {history.map((h, i) => (
            <div
              key={i}
              onClick={() => setActiveVerIdx(i)}
              className={`relative pl-8 mb-6 cursor-pointer group transition-opacity ${
                i === activeVerIdx ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div
                className={`absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 border-white z-10 transition-transform ${
                  i === activeVerIdx ? "bg-blue-500 scale-125" : "bg-slate-500 group-hover:bg-slate-400"
                }`}
              ></div>

              <div className="text-[10px] text-slate-400 font-mono mb-0.5">{h.date}</div>
              <div className="text-sm font-bold text-white mb-0.5">{h.action}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">
                  {h.user.charAt(0)}
                </span>
                {h.user}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}