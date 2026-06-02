import { AlertTriangle, ChevronDown, ChevronRight, X } from "lucide-react";
import { EnhancedDocVersion } from "../types";

type HistoryPanelProps = {
  isHistoryOpen: boolean;
  onClose: () => void;
  history: EnhancedDocVersion[];
  activeVerIdx: number;
  setActiveVerIdx: (idx: number) => void;
  unsavedActions: string[];
  expandedHistoryIdx: number | null;
  setExpandedHistoryIdx: (idx: number | null) => void;
};

export const HistoryPanel = ({
  isHistoryOpen,
  onClose,
  history,
  activeVerIdx,
  setActiveVerIdx,
  unsavedActions,
  expandedHistoryIdx,
  setExpandedHistoryIdx,
}: HistoryPanelProps) => {
  return (
    <div
      className={`absolute top-0 right-0 z-10 flex h-full w-[320px] flex-col border-l border-slate-700 bg-slate-800 shadow-2xl transition-all duration-300 ${
        isHistoryOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 h-14">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Version Control</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="absolute top-0 bottom-0 left-[29px] w-[2px] bg-slate-700 z-0"></div>

        {unsavedActions.length > 0 && (
          <div className="relative pl-8 mb-8">
            <div className="absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 border-yellow-400 bg-yellow-500 z-10 animate-pulse"></div>
            <div className="text-[10px] text-yellow-400 font-bold mb-1">EDITING (Unsaved)</div>
            <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
              {unsavedActions.map((act, i) => (
                <div
                  key={i}
                  className="text-[10px] text-slate-300 border-b border-slate-600/50 last:border-0 py-1 flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-500"></span> {act}
                </div>
              ))}
            </div>
          </div>
        )}

        {history.map((h, i) => (
          <div key={i} className={`relative pl-8 mb-6 group ${i === activeVerIdx ? "opacity-100" : "opacity-70 hover:opacity-100"}`}>
            <div
              onClick={() => setActiveVerIdx(i)}
              className={`absolute left-[24px] top-[6px] w-3 h-3 rounded-full border-2 z-10 transition-transform cursor-pointer ${
                h.isMajor ? "bg-green-500 border-white scale-125" : "bg-slate-500 border-slate-300 group-hover:bg-blue-400"
              } ${i === activeVerIdx ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800" : ""}`}
            ></div>
            <div className="cursor-pointer" onClick={() => setActiveVerIdx(i)}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-slate-400 font-mono">{h.date}</span>
                {h.isMajor && (
                  <span className="text-[9px] bg-green-900 text-green-300 px-1.5 rounded border border-green-700">
                    MAJOR
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">
                {h.ver} {h.action} {h.status === "rejected" && <AlertTriangle className="h-3 w-3 text-red-500" />}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-2">
                <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">
                  {h.user.charAt(0)}
                </span>
                {h.user}
              </div>
            </div>
            <div
              className="text-[10px] text-slate-400 bg-slate-900/50 rounded border border-slate-700 cursor-pointer hover:bg-slate-900 transition-colors"
              onDoubleClick={() => setExpandedHistoryIdx(expandedHistoryIdx === i ? null : i)}
            >
              <div
                className="p-2 flex justify-between items-center"
                onClick={() => setExpandedHistoryIdx(expandedHistoryIdx === i ? null : i)}
              >
                <span>詳細ログ ({h.actionsLog?.length || 0})</span>
                {expandedHistoryIdx === i ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
              {expandedHistoryIdx === i && (
                <div className="px-2 pb-2 border-t border-slate-700 pt-1">
                  {h.actionsLog && h.actionsLog.length > 0 ? (
                    h.actionsLog.map((log, idx) => (
                      <div key={idx} className="py-0.5 flex items-center gap-1.5 text-slate-500">
                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 italic">操作履歴なし</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
