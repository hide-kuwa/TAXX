"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Search as SearchIcon, Folder, Link as LinkIcon, Settings, User, ListTodo } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_ROLES } from "@/config/organization";
import { loadCurrentUser } from "@/lib/auth";
import { canShowSettingsNav, canShowTasksNav } from "@/lib/nav-policy";
import { resolvePersona } from "@/lib/persona";
import { Staff } from "./types";

interface NavBarProps {
  currentStaff: Staff;
  activeClientIdx: number;
  onClientChange: (idx: number) => void;
  onStaffChange: (direction: 1 | -1) => void;
  onStaffSwitch: () => void;
}

export default function NavBar({
  currentStaff,
  activeClientIdx,
  onClientChange,
  onStaffChange,
  onStaffSwitch,
}: NavBarProps) {
  const router = useRouter();
  const hScrollerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentRoleLabel, setCurrentRoleLabel] = useState<string>("");
  const [currentPersonaLabel, setCurrentPersonaLabel] = useState<string>("");
  const [currentFirmLabel, setCurrentFirmLabel] = useState<string>("");
  const [showTasksNav, setShowTasksNav] = useState(false);
  const [showSettingsNav, setShowSettingsNav] = useState(false);
  const isAutoScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastWheelTime = useRef(0);
  const wheelAccumulator = useRef(0);

  useEffect(() => {
    const user = loadCurrentUser();
    setCurrentFirmLabel(user?.firmLabel ?? "");
    setShowTasksNav(canShowTasksNav(user));
    setShowSettingsNav(canShowSettingsNav(user));
    const persona = resolvePersona(user);
    setCurrentPersonaLabel(user?.personaLabel || persona.shortLabel);
    if (!user?.appRoleId) {
      setCurrentRoleLabel("");
      return;
    }
    const role = APP_ROLES.find((item) => item.id === user.appRoleId);
    setCurrentRoleLabel(role?.label ?? user.appRoleId);
  }, []);

  useEffect(() => {
    const el = hScrollerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        wheelAccumulator.current += e.deltaY;

        const now = Date.now();
        if (Math.abs(wheelAccumulator.current) > 50 && now - lastWheelTime.current > 400) {
          const direction = wheelAccumulator.current > 0 ? 1 : -1;
          onStaffChange(direction);

          lastWheelTime.current = now;
          wheelAccumulator.current = 0;
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [onStaffChange]);

  useEffect(() => {
    const container = hScrollerRef.current;
    if (!container) return;

    isAutoScrolling.current = true;
    const items = container.querySelectorAll(".h-item");
    const targetEl = items[activeClientIdx] as HTMLElement;

    if (targetEl) {
      const offset =
        targetEl.offsetLeft -
        container.clientWidth / 2 +
        targetEl.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }

    const t = setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
    return () => clearTimeout(t);
  }, [activeClientIdx]);

  const handleScroll = useCallback(() => {
    if (isAutoScrolling.current) return;
    const container = hScrollerRef.current;
    if (!container) return;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      const center = container.scrollLeft + container.clientWidth / 2;
      const items = container.querySelectorAll(".h-item");

      let closestIdx = activeClientIdx;
      let minDiff = Infinity;

      items.forEach((item, idx) => {
        const el = item as HTMLElement;
        const itemCenter = el.offsetLeft + el.clientWidth / 2;
        const diff = Math.abs(center - itemCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      if (closestIdx !== activeClientIdx) {
        onClientChange(closestIdx);
      }
    }, 100);
  }, [activeClientIdx, onClientChange]);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
    if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 300);
  };

  return (
    <nav
      onDoubleClick={onStaffSwitch}
      className="relative z-30 flex h-24 flex-shrink-0 flex-col border-b border-slate-700 bg-slate-900 shadow-xl cursor-pointer select-none"
    >
      <div className="absolute bottom-0 left-1/2 z-0 h-full w-[200px] -translate-x-1/2 border-x border-white/10 bg-white/5 pointer-events-none"></div>

      <div className="absolute top-0 left-0 w-full text-center z-50 pointer-events-none">
        <div className="inline-block bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-lg shadow-lg flex items-center justify-center gap-2 transition-all">
          <User className="w-3 h-3" /> {currentStaff.name}
          {currentFirmLabel && (
            <span className="rounded-full border border-emerald-300/40 bg-emerald-500/25 px-2 py-0.5 text-[9px] font-black tracking-wide">
              {currentFirmLabel}
            </span>
          )}
          {currentPersonaLabel && (
            <span className="rounded-full border border-violet-300/40 bg-violet-500/25 px-2 py-0.5 text-[9px] font-black tracking-wide">
              {currentPersonaLabel}
            </span>
          )}
          {currentRoleLabel && (
            <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-black tracking-wide">
              {currentRoleLabel}
            </span>
          )}
        </div>
      </div>

      <div
        className={`absolute top-full right-0 w-full max-w-sm bg-slate-800 border-b border-slate-700 p-4 shadow-2xl z-40 rounded-bl-2xl transition-all duration-300 transform ${
          isSearchOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="書類名で検索..."
            className="w-full bg-slate-900 border border-slate-600 text-white text-xs rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div
        ref={hScrollerRef}
        onScroll={handleScroll}
        className="h-drum-scroller no-scrollbar relative z-10 h-full w-full pt-2"
      >
        <div className="w-[40vw] flex-shrink-0" />
        {currentStaff.clients.map((client, idx) => (
          <div
            key={client.id}
            onClick={(e) => {
              e.stopPropagation();
              onClientChange(idx);
            }}
            className={`h-item ${idx === activeClientIdx ? "active" : ""} group-member flex flex-col items-center justify-center`}
          >
            <div className="flex max-w-full items-start justify-center gap-1">
              {client.role === "main" ? (
                <Folder className="mt-0.5 shrink-0 text-blue-400 w-4 h-4" />
              ) : (
                <LinkIcon className="mt-0.5 shrink-0 text-blue-400 w-4 h-4" />
              )}
              <span className="h-item-name text-center">{client.name}</span>
            </div>
            {client.groupLabels && client.groupLabels.length > 0 && (
              <div className="mt-1 flex max-w-[260px] flex-wrap items-center justify-center gap-1">
                {client.groupLabels.slice(0, 2).map((label, gIdx) => (
                  <span
                    key={`${client.id}-g-${gIdx}`}
                    className="rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold text-blue-200"
                  >
                    {label}
                  </span>
                ))}
                {client.groupLabels.length > 2 && (
                  <span className="text-[9px] text-slate-300">+{client.groupLabels.length - 2}</span>
                )}
              </div>
            )}
            {client.relationLabels && client.relationLabels.length > 0 && (
              <div className="text-[9px] text-slate-300 mt-0.5">{Array.from(new Set(client.relationLabels)).join(" / ")}</div>
            )}
          </div>
        ))}
        <div className="w-[40vw] flex-shrink-0" />
      </div>

      <div className="mask-h-left pointer-events-none absolute left-0 top-0 z-20 h-full w-32"></div>
      <div className="mask-h-right pointer-events-none absolute right-0 top-0 z-20 h-full w-32"></div>

      <div className="absolute left-6 top-1/2 z-50 -translate-y-1/2 cursor-pointer text-xl font-black italic tracking-tighter text-white">
        <span className="text-brand-500">Docu</span>Grid
      </div>

      <div className="absolute right-4 top-1/2 z-50 -translate-y-1/2 flex items-center gap-2">
        {showTasksNav && (
          <button
            data-tour="tasks-nav"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/tasks");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 shadow-lg transition-all hover:text-white"
            title="今日やること"
          >
            <ListTodo className="h-4 w-4" />
          </button>
        )}
        {showSettingsNav && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/settings");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 shadow-lg transition-all hover:text-white"
            title="設定"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSearch();
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full border bg-slate-800 shadow-lg transition-all hover:text-white ${
            isSearchOpen ? "border-blue-500 text-blue-500" : "border-white/10 text-slate-400"
          }`}
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
