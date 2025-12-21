"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";
import { 
  FileText, Folder, FolderOpen, Link as LinkIcon, CheckCircle, 
  User, ArrowLeft, CalendarDays, UserCheck, UploadCloud, Loader2
} from "lucide-react";

// --- データ定義 ---
const staffList = [
  { 
    id: 's1', name: '田中 太郎 (第1課)', 
    clients: [
      { id: 'c1', name: '株式会社 鈴木商店', fiscal: 3, groupId: 'yamada', role: 'main' },
      { id: 'c1_sub1', name: '鈴木 太郎 (個人)', fiscal: 3, groupId: 'yamada', role: 'sub' },
      { id: 'c2', name: '合同会社 テック', fiscal: 12 },
      { id: 'c3', name: '山田建設', fiscal: 9 },
    ]
  },
  { 
    id: 's2', name: '佐藤 花子 (第2課)', 
    clients: [
      { id: 'c4', name: '医療法人 佐藤医院', fiscal: 12, groupId: null, role: 'main' },
      { id: 'c5', name: 'クリエイティブ合同', fiscal: 6, groupId: null, role: 'main' },
    ]
  }
];

const periods = { 
  year: ['R7', 'R6', 'R5', 'R4'], 
  month: Array.from({length: 12}, (_, i) => `${12 - i}月`) 
};

// --- カスタムフック: 2次元ジェスチャー制御 ---
function useCrossSwipe(
  ref: React.RefObject<HTMLDivElement>, 
  axis: 'h' | 'v', 
  callback: (delta: number) => void
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let accumulatedDelta = 0;
    const threshold = 40;
    let isCoolingDown = false;
    const handleWheel = (e: WheelEvent) => {
      if (isCoolingDown) return;
      if (axis === 'v') {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
          e.preventDefault(); 
          accumulatedDelta += e.deltaX;
          if (Math.abs(accumulatedDelta) > threshold) {
            callback(accumulatedDelta > 0 ? 1 : -1);
            accumulatedDelta = 0;
            isCoolingDown = true;
            setTimeout(() => isCoolingDown = false, 500);
          }
        } else { accumulatedDelta = 0; }
      } else {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 10) {
          e.preventDefault(); 
          accumulatedDelta += e.deltaY;
          if (Math.abs(accumulatedDelta) > threshold) {
            callback(accumulatedDelta > 0 ? 1 : -1);
            accumulatedDelta = 0;
            isCoolingDown = true;
            setTimeout(() => isCoolingDown = false, 500);
          }
        } else { accumulatedDelta = 0; }
      }
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [ref, axis, callback]);
}

// --- 部品: ドロップ可能な空カード ---
const DropzoneCard = ({ title, onDropFile }: { title: string, onDropFile: (f: File, t: string) => void }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDropFile(acceptedFiles[0], title);
    }
  }, [title, onDropFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    noClick: false 
  });

  return (
    <div 
      {...getRootProps()}
      className={clsx(
        "h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-2 transition-all cursor-pointer group relative overflow-hidden",
        isDragActive 
          ? "bg-blue-50 border-blue-500 scale-105 shadow-xl z-10" 
          : "bg-slate-50 border-slate-300 hover:bg-white hover:border-blue-400 hover:scale-105 hover:shadow-md"
      )}
    >
       <input {...getInputProps()} />
       {isDragActive && (
         <div className="absolute inset-0 bg-blue-100/50 flex items-center justify-center z-20 pointer-events-none">
            <UploadCloud className="text-blue-600 animate-bounce" size={40} />
         </div>
       )}
       <div className={clsx("transition-colors mb-2 text-2xl", isDragActive ? "text-blue-500" : "text-slate-300 group-hover:text-blue-500")}>+</div>
       <div className={clsx("text-xs font-bold transition-colors", isDragActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")}>{title}</div>
    </div>
  );
};


export default function Home() {
  // State
  const [staffIdx, setStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [mode, setMode] = useState<'year' | 'month'>('year');
  const [activePeriodIdx, setActivePeriodIdx] = useState(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ★ 追加: アップロード済みの書類を管理するState
  // 初期値としていくつか「済」にしておくとデモっぽいですが、今回は空（{}）でもOK
  const [uploadedStatus, setUploadedStatus] = useState<Record<string, boolean>>({
    '決算報告書': true, // デモ用に最初からこれだけ済にしておく例
  });

  // Toast
  const [toast, setToast] = useState<{show: boolean, icon: any, title: string, msg: string}>({
    show: false, icon: null, title: "", msg: ""
  });

  // Refs
  const hScrollRef = useRef<HTMLDivElement>(null);
  const vScrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const currentStaff = staffList[staffIdx];
  const currentClient = currentStaff.clients[activeClientIdx] || currentStaff.clients[0];
  const currentPeriodList = ['PERM', ...periods[mode]];
  const currentPeriodLabel = currentPeriodList[activePeriodIdx];
  const isPerm = activePeriodIdx === 0;

  // --- トースト表示 ---
  const showToast = useCallback((icon: any, title: string, msg: string) => {
    setToast({ show: true, icon, title, msg });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  }, []);

  // --- アップロード処理 ---
  const handleUpload = useCallback(async (file: File, docTitle: string) => {
    // 1. UI更新 (ビューワーを開く)
    const localUrl = URL.createObjectURL(file);
    setPdfUrl(localUrl);
    setActiveDocTitle(docTitle);
    setViewerOpen(true);
    setIsUploading(true);
    showToast(UploadCloud, "UPLOADING", `${docTitle} を保存中...`);

    // ★ 2. ステータスを更新 (ここで「済」マークをつける！)
    setUploadedStatus(prev => ({
      ...prev,
      [docTitle]: true
    }));

    // 3. API送信
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      
      showToast(CheckCircle, "SAVED", "Google Driveに保存しました");
    } catch (error) {
      console.error(error);
      showToast(Loader2, "ERROR", "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  }, [showToast]);

  // --- ビューワー内のドロップハンドラー ---
  const onViewerDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) handleUpload(acceptedFiles[0], activeDocTitle);
  }, [activeDocTitle, handleUpload]);

  const { getRootProps: getViewerRootProps, getInputProps: getViewerInputProps, isDragActive: isViewerDragActive } = useDropzone({ 
    onDrop: onViewerDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    noClick: false 
  });

  // --- 切り替えロジック ---
  const switchStaff = useCallback((direction: number) => {
    setStaffIdx(prev => {
      let next = prev + direction;
      if (next >= staffList.length) next = 0;
      if (next < 0) next = staffList.length - 1;
      showToast(UserCheck, "STAFF CHANGED", staffList[next].name);
      return next;
    });
    setActiveClientIdx(0);
  }, [showToast]);

  const switchMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'year' ? 'month' : 'year';
      showToast(CalendarDays, "MODE CHANGED", next.toUpperCase());
      return next;
    });
    setActivePeriodIdx(1);
  }, [showToast]);

  // --- ジェスチャー登録 ---
  useCrossSwipe(vScrollRef, 'v', () => switchMode());
  useCrossSwipe(hScrollRef, 'h', (delta) => switchStaff(delta > 0 ? 1 : -1));

  // --- スクロール検知 ---
  const handleScroll = (axis: 'h' | 'v') => {
    if (isAutoScrolling.current) return;
    const ref = axis === 'h' ? hScrollRef.current : vScrollRef.current;
    if (!ref) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const center = (axis === 'h' ? ref.scrollLeft : ref.scrollTop) + (axis === 'h' ? ref.clientWidth : ref.clientHeight) / 2;
      const items = ref.querySelectorAll(axis === 'h' ? '.h-item' : '.v-item');
      let closestIdx = -1; let minDiff = Infinity;
      items.forEach((item, idx) => {
        const el = item as HTMLElement;
        const itemCenter = (axis === 'h' ? el.offsetLeft : el.offsetTop) + (axis === 'h' ? el.clientWidth : el.clientHeight) / 2;
        const diff = Math.abs(center - itemCenter);
        if (diff < minDiff) { minDiff = diff; closestIdx = idx; }
      });
      if (closestIdx !== -1) {
        if (axis === 'h' && closestIdx !== activeClientIdx) setActiveClientIdx(closestIdx);
        else if (axis === 'v' && closestIdx !== activePeriodIdx) setActivePeriodIdx(closestIdx);
      }
    }, 100);
  };

  const scrollToCenter = (axis: 'h' | 'v', index: number) => {
    const ref = axis === 'h' ? hScrollRef.current : vScrollRef.current;
    if (!ref) return;
    isAutoScrolling.current = true;
    if (axis === 'h') {
      const items = ref.querySelectorAll('.h-item');
      if (items[index]) {
        const el = items[index] as HTMLElement;
        const offset = el.offsetLeft - (ref.clientWidth / 2) + (el.clientWidth / 2);
        ref.scrollTo({ left: offset, behavior: 'smooth' });
      }
    } else {
      const items = ref.querySelectorAll('.v-item');
      if (items[index]) {
        const el = items[index] as HTMLElement;
        const offset = el.offsetTop - (ref.clientHeight / 2) + (el.clientHeight / 2);
        ref.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
    setTimeout(() => { isAutoScrolling.current = false; }, 500);
  };

  useEffect(() => { scrollToCenter('h', activeClientIdx); }, [activeClientIdx, staffIdx]);
  useEffect(() => { scrollToCenter('v', activePeriodIdx); }, [activePeriodIdx, mode]);

  // --- Render ---
  const docList = isPerm ? ['定款', '履歴事項全部証明書', '株主名簿', '設立届出書'] : 
                  (mode === 'year' ? ['決算報告書', '総勘定元帳', '法人税申告書', '消費税申告書'] : ['月次試算表', '通帳コピー', '請求書綴り', '給与台帳']);
  
  // 進捗率の計算 (アップロード済み数 / 全項目数)
  // ※現在のモード(docList)に含まれるもののうち、uploadedStatusがtrueのものを数える
  const currentUploadedCount = docList.filter(title => uploadedStatus[title]).length;
  const progress = Math.round((currentUploadedCount / docList.length) * 100);
  const progressColor = isPerm ? '#eab308' : '#3b82f6';

  return (
    <div className="text-slate-600 h-screen flex flex-col bg-slate-100 font-sans overflow-hidden select-none">
      
      {/* === 上ドラム === */}
      <nav className="h-24 bg-slate-900 border-b border-slate-700 relative flex flex-col z-30 shadow-xl flex-shrink-0">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[200px] h-full bg-white/5 border-x border-white/10 pointer-events-none z-0"></div>
        <div className="absolute top-0 left-0 w-full text-center z-50 pointer-events-none">
           <div className={clsx("inline-block bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-lg shadow-lg transition-transform duration-300", toast.show && toast.title === "STAFF CHANGED" ? "translate-y-0" : "-translate-y-full")}>
             <UserCheck size={10} className="inline mr-1"/> {currentStaff.name}
           </div>
        </div>
        <div ref={hScrollRef} onScroll={() => handleScroll('h')} className="h-drum-scroller w-full h-full relative z-10 no-scrollbar pt-2">
          <div style={{ width: '50vw', flexShrink: 0 }}></div>
          {currentStaff.clients.map((client, idx) => (
            <div key={client.id} onClick={() => setActiveClientIdx(idx)} className={clsx("h-item group-member", idx === activeClientIdx && "active")}>
              <div className="flex items-center justify-center gap-1">
                {client.role === 'main' ? (idx === activeClientIdx ? <FolderOpen size={16} className="text-blue-400"/> : <Folder size={16} className="opacity-50"/>) : <LinkIcon size={14} className="text-blue-400"/>}
                {client.name}
              </div>
            </div>
          ))}
          <div style={{ width: '50vw', flexShrink: 0 }}></div>
        </div>
        <div className="absolute left-0 top-0 h-full w-32 mask-h-left pointer-events-none z-20"></div>
        <div className="absolute right-0 top-0 h-full w-32 mask-h-right pointer-events-none z-20"></div>
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 text-white font-black italic text-xl tracking-tighter cursor-pointer group" onClick={() => switchStaff(1)}>
          <span className="text-blue-500 group-hover:text-white transition-colors">Docu</span>Grid
        </div>
      </nav>

      {/* === メイン === */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-24 bg-slate-900 h-full relative flex flex-col items-center justify-center shadow-2xl z-20 flex-shrink-0 border-r border-slate-700">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-20 bg-white/5 border-y border-white/10 pointer-events-none z-0"></div>
          <div onClick={switchMode} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer hover:scale-110 transition-transform">
            <span className={clsx("text-[9px] font-black tracking-widest", mode === 'year' ? "text-blue-500" : "text-green-500")}>{mode.toUpperCase()}</span>
          </div>
          <div ref={vScrollRef} onScroll={() => handleScroll('v')} className="v-drum-scroller h-full w-full py-[calc(50vh-80px)] flex flex-col items-center gap-6 relative z-10 no-scrollbar">
             <div style={{ height: '50%', flexShrink: 0 }}></div>
             {currentPeriodList.map((p, idx) => (
               <div key={p} onClick={() => setActivePeriodIdx(idx)} className={clsx("v-item w-full py-4 text-center", idx === activePeriodIdx && "active")}>
                  {p === 'PERM' ? <><div className="text-2xl font-black text-yellow-400">永続</div><div className="text-[9px] font-bold opacity-60 text-yellow-400">PERM</div></> : <><div className={clsx("text-2xl font-black tracking-tighter", mode === 'month' && parseInt(p) === currentClient.fiscal ? "text-red-500" : "text-white")}>{p}</div>{mode === 'year' && idx === activePeriodIdx && <div className="text-[9px] font-bold opacity-60 text-white">YEAR</div>}</>}
               </div>
             ))}
             <div style={{ height: '50%', flexShrink: 0 }}></div>
          </div>
          <div className="absolute top-0 left-0 w-full h-24 mask-v-top pointer-events-none z-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-24 mask-v-bottom pointer-events-none z-20"></div>
        </aside>

        <main className="flex-1 flex flex-col bg-slate-100 relative">
           <header className="bg-white/80 backdrop-blur px-8 py-3 border-b border-slate-200 flex justify-between items-center z-10 h-20">
              <div>
                 <div className="flex items-center gap-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={10} /> {currentStaff.name.split(' ')[0]}</div>
                    <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded border", currentClient.fiscal === 3 ? "bg-red-100 text-red-500 border-red-200" : "bg-slate-100 text-slate-500 border-slate-200")}>{currentClient.fiscal}月決算</span>
                 </div>
                 <div className="text-xl font-bold text-slate-800 leading-tight mt-1 flex items-center">
                    {isPerm ? <span className="text-yellow-500 mr-2">永続</span> : <span className={clsx("mr-2", mode === 'year' ? 'text-blue-600' : 'text-green-500')}>{currentPeriodLabel}</span>}
                    {isPerm ? "永久保存ドキュメント" : (mode === 'year' ? '決算資料' : '月次監査')}
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-right"><span className="text-2xl font-black" style={{ color: progressColor }}>{progress}%</span></div>
                 <div className="w-12 h-12 relative flex items-center justify-center"><svg className="transform -rotate-90 w-12 h-12"><circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="transparent" /><circle cx="24" cy="24" r="20" stroke={progressColor} strokeWidth="4" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (125 * progress / 100)} className="transition-all duration-700" /></svg></div>
              </div>
           </header>
           
           {/* === グリッドエリア === */}
           <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
                 {docList.map((title) => {
                   // ★ 修正: uploadedStatus をチェックして表示を切り替える
                   const isFilled = uploadedStatus[title];

                   return isFilled ? (
                     // 済カード
                     <div key={title} onClick={() => { setActiveDocTitle(title); setViewerOpen(true); setPdfUrl(null); }} className={clsx("h-32 rounded-xl p-4 flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer bg-white border-l-4 shadow-sm", isPerm ? "border-yellow-400" : "border-indigo-500")}>
                        <div className="flex justify-between items-start"><FileText className={clsx("text-xl", isPerm ? "text-yellow-500" : "text-indigo-500")} /><CheckCircle className="text-green-500" size={20} /></div>
                        <div className="text-sm font-bold text-slate-700 leading-tight">{title}</div>
                     </div>
                   ) : (
                     // 未カード (Dropzone)
                     <DropzoneCard key={title} title={title} onDropFile={handleUpload} />
                   );
                 })}
              </div>
           </div>
        </main>
        
        {/* Toast */}
        <div className={clsx("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 text-white px-8 py-6 rounded-2xl shadow-2xl backdrop-blur z-50 flex flex-col items-center gap-2 border border-slate-700 transition-all duration-300 pointer-events-none", toast.show ? "opacity-100 scale-100" : "opacity-0 scale-90")}>
           {toast.icon && <toast.icon className="text-4xl text-blue-500 mb-2" />}
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{toast.title}</div>
           <div className="text-xl font-black">{toast.msg}</div>
        </div>
      </div>

      {/* === ビューワー === */}
      {viewerOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 flex animate-fade-in-up">
           <div className="flex-1 flex flex-col h-full relative">
              <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-20">
                 <button onClick={() => setViewerOpen(false)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16} /> 戻る</button>
                 <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-sm">{activeDocTitle}</h2>
                    {isUploading && <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold"><Loader2 size={10} className="animate-spin"/> Uploading...</span>}
                 </div>
                 <div className="w-8"></div>
              </header>

              <div 
                {...getViewerRootProps()} 
                className={clsx(
                  "flex-1 flex items-center justify-center bg-slate-100 flex-col relative outline-none transition-colors",
                  isViewerDragActive ? "bg-blue-50 border-4 border-blue-400 border-dashed" : "bg-slate-100"
                )}
              >
                 <input {...getViewerInputProps()} />
                 {pdfUrl ? (
                   <iframe src={pdfUrl} className="w-full h-full" />
                 ) : (
                   <div className="text-center opacity-40">
                      {isViewerDragActive ? (
                        <UploadCloud size={100} className="mx-auto text-blue-500 scale-110 transition-transform" />
                      ) : (
                        <FileText size={100} className="mx-auto text-slate-400" />
                      )}
                      <p className="mt-4 font-bold text-slate-400">{isViewerDragActive ? "Drop Here!" : "Drag & Drop or Click"}</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}