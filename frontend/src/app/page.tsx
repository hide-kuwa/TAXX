"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Search as SearchIcon,
  Folder,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Plus,
  ArrowLeft,
  PenTool,
  History,
  Columns,
  Check,
  File as FileIcon,
  MessageCircle,
  User,
} from "lucide-react";

// --- Types ---
type UploadStatus = "idle" | "uploading" | "success" | "error";

type PdfInfoResponse = {
  pageCount?: number;
  fileId?: string;
  id?: string;
};

// --- Mock Data ---
const STAFF_DATA = [
  {
    id: "s1",
    name: "田中 太郎 (第1課)",
    clients: [
      { id: "c1", name: "株式会社 鈴木商店", fiscal: 3, role: "main" },
      { id: "c2", name: "合同会社 テック", fiscal: 12, role: "main" },
      { id: "c3", name: "佐藤商事", fiscal: 9, role: "main" },
    ],
  },
  {
    id: "s2",
    name: "佐藤 次郎 (第2課)",
    clients: [
      { id: "c4", name: "鈴木 太郎 (個人)", fiscal: 12, role: "sub" },
      { id: "c5", name: "山田不動産", fiscal: 12, role: "main" },
    ],
  },
];

const PERIODS = {
  year: ["R7", "R6", "R5", "R4"],
  month: Array.from({ length: 12 }, (_, i) => `${12 - i}月`),
};

export default function DocuGridPage() {
  // --- UI State ---
  const [activeStaffIdx, setActiveStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"year" | "month">("year");
  const [activePeriodIdx, setActivePeriodIdx] = useState(1); // 0=PERM
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- Backend State ---
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // --- Refs for Scrolling Logic ---
  const hScrollerRef = useRef<HTMLDivElement>(null);
  const vScrollerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Throttle for wheel events to prevent rapid switching
  const lastWheelTime = useRef(0);

  // --- Helpers ---
  const currentStaff = STAFF_DATA[activeStaffIdx];
  const currentClient = currentStaff.clients[activeClientIdx] || { fiscal: 3, name: "Unknown" };

  // Scroll to center active element (Click & Auto-scroll)
  const scrollToActive = useCallback((axis: 'h' | 'v') => {
    const container = axis === 'h' ? hScrollerRef.current : vScrollerRef.current;
    if (!container) return;

    // Find the active item inside the container
    const items = container.querySelectorAll(axis === 'h' ? '.h-item' : '.v-item');
    const targetIdx = axis === 'h' ? activeClientIdx : activePeriodIdx;
    const targetEl = items[targetIdx] as HTMLElement;

    if (targetEl) {
      const containerCenter = axis === 'h' ? container.clientWidth / 2 : container.clientHeight / 2;
      const elCenter = axis === 'h' ? targetEl.clientWidth / 2 : targetEl.clientHeight / 2;
      const currentScroll = axis === 'h' ? container.scrollLeft : container.scrollTop;
      const elOffset = axis === 'h' ? targetEl.offsetLeft : targetEl.offsetTop;

      const targetScroll = elOffset - containerCenter + elCenter;

      container.scrollTo({
        [axis === 'h' ? 'left' : 'top']: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [activeClientIdx, activePeriodIdx]);

  // Sync scroll on state change
  useEffect(() => { scrollToActive('h'); }, [activeClientIdx, scrollToActive]);
  useEffect(() => { scrollToActive('v'); }, [activePeriodIdx, scrollToActive]);

  // --- Wheel / Trackpad Logic (Cross-Axis Switching) ---
  useEffect(() => {
    const hEl = hScrollerRef.current;
    const vEl = vScrollerRef.current;
    if (!hEl || !vEl) return;

    const COOLDOWN = 500; // ms
    const THRESHOLD = 20; // sensitivity

    const handleHWheel = (e: WheelEvent) => {
      // Horizontal Bar: Detect VERTICAL scroll (deltaY) to switch STAFF
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > THRESHOLD) {
        const now = Date.now();
        if (now - lastWheelTime.current > COOLDOWN) {
          e.preventDefault();
          const direction = e.deltaY > 0 ? 1 : -1;
          // Loop staff index
          setActiveStaffIdx(prev => {
            let next = prev + direction;
            if (next >= STAFF_DATA.length) next = 0;
            if (next < 0) next = STAFF_DATA.length - 1;
            return next;
          });
          setActiveClientIdx(0); // Reset client when staff changes
          lastWheelTime.current = now;
        }
      }
    };

    const handleVWheel = (e: WheelEvent) => {
      // Vertical Bar: Detect HORIZONTAL scroll (deltaX) to switch MODE
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > THRESHOLD) {
        const now = Date.now();
        if (now - lastWheelTime.current > COOLDOWN) {
          e.preventDefault();
          setActiveMode(prev => prev === "year" ? "month" : "year");
          setActivePeriodIdx(1); // Reset to latest period
          lastWheelTime.current = now;
        }
      }
    };

    hEl.addEventListener('wheel', handleHWheel, { passive: false });
    vEl.addEventListener('wheel', handleVWheel, { passive: false });

    return () => {
      hEl.removeEventListener('wheel', handleHWheel);
      vEl.removeEventListener('wheel', handleVWheel);
    };
  }, []);

  // --- Search Logic ---
  const toggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  };

  // --- Backend Integration ---
  const uploadEndpoint = "http://localhost:3100/api/pdf/info";
  const highlightEndpoint = "http://localhost:3100/api/highlight";

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setUploadStatus("uploading");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(uploadEndpoint, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = (await response.json()) as PdfInfoResponse;
      setPageCount(typeof data.pageCount === "number" ? data.pageCount : null);
      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    clearPreviewUrl(pdfUrl);
    setPdfUrl(URL.createObjectURL(selectedFile));
    setIsViewerOpen(true);
    uploadFile(selectedFile);
  }, [clearPreviewUrl, pdfUrl, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleHighlight = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("page", "0");
      formData.append("x", "100");
      formData.append("y", "100");
      formData.append("width", "200");
      formData.append("height", "100");
      const response = await fetch(highlightEndpoint, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Highlight failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `processed_${file.name}`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
      alert("処理完了: 赤枠を追加しました");
    } catch (error) {
      console.error(error);
      alert("処理失敗");
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl]);

  useEffect(() => { return () => clearPreviewUrl(pdfUrl); }, [pdfUrl, clearPreviewUrl]);

  // --- Derived State for Grid ---
  // Demo Logic: Simulate "Uploaded" state for specific items based on screenshot
  // R7 (idx=0 in PERIODS, but here it's idx=1 because idx=0 is PERM)
  // Let's assume idx=1 is "R7".
  const items = activePeriodIdx === 0
      ? ["定款", "履歴事項全部証明書", "株主名簿", "設立届出書"]
      : activeMode === "year"
      ? ["決算報告書", "総勘定元帳", "法人税申告書", "消費税申告書"]
      : ["月次試算表", "通帳コピー", "請求書綴り", "給与台帳"];

  const progressPercent = activePeriodIdx === 0 ? 100 : file ? 50 : 0;

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-600 overflow-hidden font-sans select-none">
      {/* --- Navbar --- */}
      <nav 
        className="relative z-30 flex h-24 flex-shrink-0 flex-col border-b border-slate-700 bg-slate-900 shadow-xl"
      >
        <div className="absolute bottom-0 left-1/2 z-0 h-full w-[200px] -translate-x-1/2 border-x border-white/10 bg-white/5 pointer-events-none"></div>
        
        {/* Staff Indicator */}
        <div className="absolute top-0 left-0 w-full text-center z-50 pointer-events-none">
             <div className="inline-block bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-lg shadow-lg flex items-center justify-center gap-1 transition-all">
                <User className="w-3 h-3" /> {currentStaff.name}
             </div>
        </div>

        {/* Search Bar (Collapsible) */}
        <div 
          className={`absolute top-full right-0 w-full max-w-sm bg-slate-800 border-b border-slate-700 p-4 shadow-2xl z-40 rounded-bl-2xl transition-all duration-300 transform ${
            isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
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

        {/* Horizontal Drum Scroller */}
        <div 
          ref={hScrollerRef}
          className="h-drum-scroller no-scrollbar relative z-10 h-full w-full pt-2"
        >
          <div className="w-[40vw] flex-shrink-0" />
          {currentStaff.clients.map((client, idx) => (
            <div
              key={client.id}
              onClick={(e) => { e.stopPropagation(); setActiveClientIdx(idx); }}
              className={`h-item ${idx === activeClientIdx ? "active" : ""} group-member flex flex-col items-center justify-center`}
            >
              <div className="flex items-center gap-1">
                 {client.role === 'main' ? <Folder className="text-blue-400 w-4 h-4" /> : <LinkIcon className="text-blue-400 w-4 h-4"/>}
                 {client.name}
              </div>
            </div>
          ))}
          <div className="w-[40vw] flex-shrink-0" />
        </div>

        {/* Masks */}
        <div className="mask-h-left pointer-events-none absolute left-0 top-0 z-20 h-full w-32"></div>
        <div className="mask-h-right pointer-events-none absolute right-0 top-0 z-20 h-full w-32"></div>

        {/* Logo */}
        <div className="absolute left-6 top-1/2 z-50 -translate-y-1/2 cursor-pointer text-xl font-black italic tracking-tighter text-white">
          <span className="text-brand-500">Docu</span>Grid
        </div>

        {/* Search Toggle Button */}
        <div className="absolute right-4 top-1/2 z-50 -translate-y-1/2">
          <button 
            onClick={toggleSearch}
            className={`flex h-10 w-10 items-center justify-center rounded-full border bg-slate-800 shadow-lg transition-all hover:text-white ${isSearchOpen ? 'border-blue-500 text-blue-500' : 'border-white/10 text-slate-400'}`}
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar (Vertical Drum) */}
        <aside 
            className="relative z-20 flex h-full w-24 flex-shrink-0 flex-col items-center justify-center border-r border-slate-700 bg-slate-900 shadow-2xl transition-transform duration-300"
        >
          <div className="pointer-events-none absolute top-1/2 z-0 h-20 w-full -translate-y-1/2 border-y border-white/10 bg-white/5"></div>
          
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 opacity-100 transition-all duration-300">
            <span className={`text-[9px] font-black tracking-widest ${activeMode === 'year' ? 'text-blue-500' : 'text-green-500'}`}>
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
                onClick={(e) => { e.stopPropagation(); setActivePeriodIdx(idx); }}
                className={`v-item w-full py-4 text-center ${idx === activePeriodIdx ? "active" : ""} ${p === 'PERM' ? 'text-yellow-400' : 'text-white'}`}
              >
                {p === 'PERM' ? (
                   <><div className="text-2xl font-black">永続</div><div className="text-[9px] font-bold opacity-60">PERMANENT</div></>
                ) : (
                   <><div className="text-2xl font-black tracking-tighter">{p}</div>{activeMode === 'year' && <div className="text-[9px] font-bold opacity-60">YEAR</div>}</>
                )}
              </div>
            ))}
             <div className="h-1/2 flex-shrink-0" />
          </div>

          <div className="mask-v-top pointer-events-none absolute left-0 top-0 z-20 h-24 w-full"></div>
          <div className="mask-v-bottom pointer-events-none absolute bottom-0 left-0 z-20 h-24 w-full"></div>
        </aside>

        {/* Main Content */}
        <main className="relative flex flex-1 flex-col bg-slate-100 transition-opacity duration-300">
          <header className="z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-3 backdrop-blur">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CLIENT</div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${currentClient.fiscal === 3 ? "bg-red-100 text-red-500 border-red-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {currentClient.fiscal}月決算
                </span>
              </div>
              <div className="text-xl font-bold leading-tight text-slate-800">
                {activePeriodIdx === 0 ? <span className="text-yellow-500">永久保存ドキュメント</span> : 
                  <span><span className={activeMode === 'year' ? "text-blue-600 mr-2" : "text-green-500 mr-2"}>
                    {activeMode === 'year' ? PERIODS.year[activePeriodIdx-1] : PERIODS.month[activePeriodIdx-1]}
                  </span>{activeMode === 'year' ? '決算資料' : '月次監査'}</span>
                }
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right"><span className="text-2xl font-black text-brand-600">{progressPercent}%</span></div>
              <div className="relative flex h-12 w-12 items-center justify-center">
                <svg className="h-12 w-12 -rotate-90 transform">
                  <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="transparent"/>
                  <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="4" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (125 * progressPercent) / 100} className="transition-all duration-700"/>
                </svg>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 fade-in-up">
              {items.map((title, i) => {
                // スクリーンショット通りの見た目を再現
                // Demo: 最初の2つは「アップロード済み（青い線＋チェック）」、3つ目は「Dropzone（点線）」
                const isUploaded = activePeriodIdx !== 0 && i < 2; // Demo: 最初の2つを済みとする
                const isDropzone = activePeriodIdx !== 0 && i === 2; // Demo: 3つ目をDropzoneとする

                if (isUploaded) return (
                    <div key={i} className="flex h-32 cursor-pointer flex-col justify-between rounded-xl border-l-4 border-blue-600 bg-white p-4 shadow-sm transition-transform hover:scale-105">
                      <div className="flex items-start justify-between">
                          <FileText className="text-xl text-blue-600" />
                          <CheckCircle className="text-green-500 w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold leading-tight text-slate-700">{title}</div>
                    </div>
                );
                
                if (isDropzone) return (
                    <div key={i} {...getRootProps()} className={`group flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-2 text-center transition-colors hover:bg-white ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}>
                      <input {...getInputProps()} />
                      <Plus className="mb-2 text-slate-300 group-hover:text-blue-500" />
                      <div className="text-xs font-bold text-slate-400 group-hover:text-blue-500">{file ? file.name : title}</div>
                      <div className="mt-1 text-[10px] text-blue-500 font-bold">{file ? "CLICK TO OPEN" : "UPLOAD"}</div>
                    </div>
                );

                // 通常の空きスロット
                return (
                    <div key={i} className="group flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 text-center transition-colors hover:border-blue-400 hover:bg-white">
                        <Plus className="mb-2 text-slate-300 group-hover:text-blue-500" />
                        <div className="text-xs font-bold text-slate-400 group-hover:text-blue-500">{title}</div>
                    </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* --- Viewer Modal --- */}
        {isViewerOpen && (
          <div className="fixed inset-0 z-50 flex animate-fade-in-up bg-slate-900/95">
            <div className="relative flex h-full flex-1 flex-col">
              <header className="z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsViewerOpen(false)} className="flex items-center gap-1 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> 戻る</button>
                  <div className="h-6 w-px bg-slate-600"></div>
                  <h2 className="text-sm font-bold text-white">{file ? file.name : "Document"}</h2>
                  <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">v6.0 最新版 (申告済)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="mr-2 flex items-center gap-1 text-[10px] text-slate-400"><PenTool className="h-3 w-3" /> Click to Verify</div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-slate-600"><History className="h-4 w-4" /></button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-700 text-white transition-colors hover:bg-blue-600"><Columns className="h-4 w-4" /></button>
                  <button onClick={handleHighlight} disabled={isLoading} className="flex items-center rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 disabled:bg-blue-400">
                    {isLoading ? "処理中..." : <><Check className="mr-1 h-3 w-3" /> 完了</>}
                  </button>
                </div>
              </header>
              <div className="relative flex flex-1 overflow-hidden">
                <div className="relative flex-1 border-r border-slate-300 bg-slate-100">
                  {pdfUrl ? <embed src={pdfUrl} type="application/pdf" className="h-full w-full" /> : <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10"><div className="text-center"><FileIcon className="h-32 w-32 mx-auto" /><p className="mt-4 text-4xl font-black">MAIN DOC</p></div></div>}
                  {pageCount !== null && (
                      <div className="absolute top-10 left-10 max-w-xs transform rotate-1 rounded-xl border border-yellow-200 bg-yellow-100 p-4 text-yellow-800 shadow-lg">
                        <div className="mb-1 text-xs font-bold flex items-center gap-1"><MessageCircle className="h-3 w-3"/> System Info</div>
                        <p className="text-sm font-bold">Page Count: {pageCount} <br/> Status: {uploadStatus}</p>
                    </div>
                  )}
                </div>
                <div className="relative w-0 overflow-hidden bg-slate-200 transition-all duration-300"><div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center text-slate-400"><p className="text-sm font-bold">比較する書類を選択</p></div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}