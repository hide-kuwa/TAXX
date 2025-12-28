"use client";

import { useRef, useEffect } from "react";
import { PERIODS } from "./mockData";

interface SidebarProps {
  activeMode: "year" | "month";
  activePeriodIdx: number;
  onPeriodChange: (idx: number) => void;
  onModeSwitch: () => void;
}

export default function Sidebar({
  activeMode,
  activePeriodIdx,
  onPeriodChange,
  onModeSwitch,
}: SidebarProps) {
  const vScrollerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    const el = vScrollerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);

      if (isVertical && Math.abs(e.deltaY) > 10) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelTime.current > 300) {
          const direction = e.deltaY > 0 ? 1 : -1;
          const maxIdx = PERIODS[activeMode].length;
          const nextIdx = Math.max(0, Math.min(activePeriodIdx + direction, maxIdx));

          if (nextIdx !== activePeriodIdx) {
            onPeriodChange(nextIdx);
            lastWheelTime.current = now;
          }
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [activeMode, activePeriodIdx, onPeriodChange]);

  useEffect(() => {
    const container = vScrollerRef.current;
    if (!container) return;
    const items = container.querySelectorAll(".v-item");
    const targetEl = items[activePeriodIdx] as HTMLElement;

    if (targetEl) {
      const offset =
        targetEl.offsetTop -
        container.clientHeight / 2 +
        targetEl.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [activePeriodIdx]);

  return (
    <aside
      onDoubleClick={onModeSwitch}
      className="relative z-20 flex h-full w-24 flex-shrink-0 flex-col items-center justify-center border-r border-slate-700 bg-slate-900 shadow-2xl transition-transform duration-300 cursor-pointer select-none"
    >
      <div className="pointer-events-none absolute top-1/2 z-0 h-20 w-full -translate-y-1/2 border-y border-white/10 bg-white/5"></div>

      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 opacity-100 transition-all duration-300">
        <span
          className={`text-[9px] font-black tracking-widest ${activeMode === "year" ? "text-blue-500" : "text-green-500"}`}
        >
          {activeMode.toUpperCase()}
        </span>
      </div>

      <div
        ref={vScrollerRef}
        className="v-drum-scroller no-scrollbar relative z-10 flex h-full w-full flex-col items-center gap-6 py-[calc(50vh-80px)]"
      >
        <div className="h-1/2 flex-shrink-0" />
        {["PERM", ...PERIODS[activeMode]].map((p, idx) => (
          <div
            key={p}
            onClick={(e) => {
              e.stopPropagation();
              onPeriodChange(idx);
            }}
            className={`v-item w-full py-4 text-center ${idx === activePeriodIdx ? "active" : ""} ${p === "PERM" ? "text-yellow-400" : "text-white"}`}
          >
            {p === "PERM" ? (
              <>
                <div className="text-2xl font-black">永続</div>
                <div className="text-[9px] font-bold opacity-60">PERMANENT</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black tracking-tighter">{p}</div>
                {activeMode === "year" && (
                  <div className="text-[9px] font-bold opacity-60">YEAR</div>
                )}
              </>
            )}
          </div>
        ))}
        <div className="h-1/2 flex-shrink-0" />
      </div>

      <div className="mask-v-top pointer-events-none absolute left-0 top-0 z-20 h-24 w-full"></div>
      <div className="mask-v-bottom pointer-events-none absolute bottom-0 left-0 z-20 h-24 w-full"></div>
    </aside>
  );
}
