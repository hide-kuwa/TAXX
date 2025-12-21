// src/components/VirtualJournalGrid.tsx
"use client";

import { Virtuoso } from "react-virtuoso";
import { clsx } from "clsx";

// ダミーデータ（1万件）
const rows = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  date: `2025-03-${String((i % 30) + 1).padStart(2, "0")}`,
  debit: "通信費",
  credit: "現金",
  amount: (Math.random() * 10000).toFixed(0),
  summary: `NTTドコモ 3月分利用料 No.${i}`,
}));

export default function VirtualJournalGrid() {
  return (
    <div className="h-full w-full bg-white overflow-hidden flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center bg-slate-100 border-b border-slate-300 px-4 h-8 text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 z-10">
        <div className="w-12">No.</div>
        <div className="w-24">Date</div>
        <div className="w-24">Debit</div>
        <div className="w-24">Credit</div>
        <div className="w-20 text-right">Amount</div>
        <div className="flex-1 ml-4">Summary</div>
      </div>

      {/* 仮想リスト本体 */}
      <div className="flex-1 h-full">
        <Virtuoso
          style={{ height: '100%' }}
          totalCount={rows.length}
          itemContent={(index) => {
            const row = rows[index];
            return (
              <div
                className={clsx(
                  "flex items-center border-b border-slate-200 px-4 hover:bg-blue-50 cursor-pointer transition-colors text-sm h-10",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                )}
              >
                <div className="w-12 text-slate-400">{row.id}</div>
                <div className="w-24 font-mono text-slate-600">{row.date}</div>
                <div className="w-24 font-bold text-blue-600">{row.debit}</div>
                <div className="w-24 text-slate-600">{row.credit}</div>
                <div className="w-20 text-right font-mono font-bold text-slate-800">
                  ¥{Number(row.amount).toLocaleString()}
                </div>
                <div className="flex-1 ml-4 text-slate-500 truncate">{row.summary}</div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}