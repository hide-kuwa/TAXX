import { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ToolType } from "../types";

type AnnotatableTool = Exclude<ToolType, "none">;

interface UsePdfEditorProps {
  file: File | null;
  pdfUrl: string | null;
  editorKey: string;
  pageCount: number | null;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
  onHighlight: (type: AnnotatableTool, page: number, rect: any) => Promise<File | void>;
  onReorder: (order: number[]) => Promise<File | void>;
  onMerge: (files: File[]) => Promise<File | void>;
  onGetThumbnails: () => Promise<string[]>;
  recordAction: (newFile: File, action: string) => void;
}

export const usePdfEditor = ({
  file,
  pdfUrl,
  editorKey,
  pageCount,
  onRenderPage,
  onHighlight,
  onReorder,
  onMerge,
  onGetThumbnails,
  recordAction
}: UsePdfEditorProps) => {

  // ========================================================================
  // 1. Ref戦略: 親から渡された関数や値をRefに閉じ込め、依存配列から排除する
  // ========================================================================
  const handlersRef = useRef({
    onRenderPage,
    onHighlight,
    onReorder,
    onMerge,
    onGetThumbnails,
    recordAction
  });

  // 常に最新のハンドラをRefに維持（レンダリングの影響を受けない）
  useEffect(() => {
    handlersRef.current = {
      onRenderPage,
      onHighlight,
      onReorder,
      onMerge,
      onGetThumbnails,
      recordAction
    };
  });

  // ファイルの実体もRefで持つ（非同期処理の中で参照するため）
  const fileRef = useRef<File | null>(file);
  useEffect(() => { fileRef.current = file; }, [file]);

  // ========================================================================
  // 2. State定義
  // ========================================================================
  const [editPageImage, setEditPageImage] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [activeTool, setActiveTool] = useState<ToolType>("none");
  const [isReordering, setIsReordering] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [comparePreviewUrl, setComparePreviewUrl] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [undoStack, setUndoStack] = useState<number[][]>([]);
  const [redoStack, setRedoStack] = useState<number[][]>([]);

  // 描画系State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // 3. 統合初期化フロー (ここがループ防止の心臓部)
  // ========================================================================

  // ★統合useEffect: editorKeyが変わった時だけ、すべてのデータを読み直す
  useEffect(() => {
    let isMounted = true;

    const initializeEditor = async () => {
      // 1. ファイルがない場合のリセット
      if (!editorKey || !fileRef.current) {
        if (isMounted) {
          setEditPageImage(null);
          setThumbnails([]);
          setReferenceFile(null);
          setCurrentPage(0);
        }
        return;
      }

      // 2. 重たい処理 (サムネイル)
      try {
        const imgs = await handlersRef.current.onGetThumbnails();

        if (isMounted) {
          setThumbnails(imgs);
          setCurrentPage((prev) => {
            const maxPage = Math.max(0, imgs.length - 1);
            return Math.min(prev, maxPage);
          });
        }
      } catch (error) {
        console.error("Failed to initialize PDF editor:", error);
      }
    };

    initializeEditor();

    return () => { isMounted = false; };
  }, [editorKey, pdfUrl]); // pdfUrl changes trigger re-init

  useEffect(() => {
    let isMounted = true;
    const loadCurrentPageImage = async () => {
      if (!fileRef.current) {
        setEditPageImage(null);
        return;
      }
      const img = await handlersRef.current.onRenderPage(currentPage);
      if (isMounted) {
        setEditPageImage(img);
      }
    };
    void loadCurrentPageImage();
    return () => {
      isMounted = false;
    };
  }, [currentPage, editorKey]);

  // ページ数が変わった時だけオーダーをリセット
  useEffect(() => {
    if (pageCount) {
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
      setSelectedSlots([]);
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [pageCount]);

  const applyPageOrderChange = useCallback((updater: (current: number[]) => number[]) => {
    setPageOrder((current) => {
      const next = updater(current);
      if (next.join(",") === current.join(",")) return current;
      setUndoStack((prev) => [...prev, current]);
      setRedoStack([]);
      return next;
    });
  }, []);

  // ========================================================================
  // 4. アクションハンドラー (依存配列は空にする)
  // ========================================================================

  const applyAnnotation = useCallback(async (type: ToolType, rect: any) => {
    const currentFile = fileRef.current;
    if (type === "none" || !currentFile) return;
    
    // 処理実行
    const newFile = await handlersRef.current.onHighlight(type, currentPage, rect);
    
    if (newFile) {
      const actionName = {
        marker: "マーカー",
        box: "赤枠",
        line: "ライン",
        check: "チェック",
        none: "編集"
      }[type] || "編集";

      // 1. 親の状態を更新 (これで親が再レンダリングされる)
      handlersRef.current.recordAction(newFile as File, actionName);
      
      // 2. UX向上のため、親の反応を待たずにローカル画像を更新してしまう
      // (次のuseEffectが走るまでのつなぎ。useEffect側では isMounted チェックがあるため競合しない)
      const newImg = await handlersRef.current.onRenderPage(currentPage, newFile as File);
      if (newImg) setEditPageImage(newImg);
      
    }
  }, []);

  const handleSaveReorder = useCallback(async () => {
    if (!fileRef.current) return;
    const newFile = await handlersRef.current.onReorder(pageOrder);
    if (newFile) {
      handlersRef.current.recordAction(newFile as File, "ページ並べ替え");
      setIsReordering(false);
      setSelectedSlots([]);
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [pageOrder]); // pageOrderはローカルstateなので依存に入れてOK

  const onDropAppend = useCallback(async (acceptedFiles: File[]) => {
    const currentFile = fileRef.current;
    if (!currentFile || acceptedFiles.length === 0) return;
    const newFile = await handlersRef.current.onMerge([currentFile, ...acceptedFiles]);
    if (newFile) {
      handlersRef.current.recordAction(newFile as File, `PDF結合 (+${acceptedFiles.length}ファイル)`);
    }
  }, []);

  // Dropzone設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAppend, 
    accept: { "application/pdf": [".pdf"] }, 
    multiple: true, 
    noClick: true
  });

  // ========================================================================
  // 5. その他のUIロジック (分割ビュー / 描画)
  // ========================================================================
  
  const toggleSplitView = useCallback(() => setIsSplitView(p => !p), []);

  useEffect(() => {
    if (isSplitView && referenceFile) {
      const url = URL.createObjectURL(referenceFile);
      setComparePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setComparePreviewUrl(null);
    }
  }, [isSplitView, referenceFile]);

  // Drawing Logic
  const getNormalizedPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === "none" || activeTool === "check") return;
    setIsDrawing(true);
    const pos = getNormalizedPos(e);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;
    const pos = getNormalizedPos(e);
    setCurrentRect({
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        w: Math.abs(pos.x - startPos.x),
        h: Math.abs(pos.y - startPos.y)
    });
  }, [isDrawing, startPos]);

  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (activeTool === "check") {
        const pos = getNormalizedPos(e);
        const size = 0.05; 
        await applyAnnotation("check", { x: pos.x - size/2, y: pos.y - size/2, w: size, h: size });
        return;
    }
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 0.01 || currentRect.h > 0.01) {
        await applyAnnotation(activeTool, currentRect);
    }
    setStartPos(null);
    setCurrentRect(null);
  }, [activeTool, isDrawing, currentRect, applyAnnotation]);

  // Drag & Drop Reordering
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const handleDragStart = useCallback((e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragOverSlot = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    dragOverItem.current = position;
  }, []);
  const handleDropSlot = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (dragItem.current === null) return;
    const from = dragItem.current;
    const to = position;
    if (from === to) return;
    applyPageOrderChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSelectedSlots((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((slot) => {
        if (slot === from) return to;
        if (from < to && slot > from && slot <= to) return slot - 1;
        if (from > to && slot >= to && slot < from) return slot + 1;
        return slot;
      });
    });
    dragItem.current = to;
  }, [applyPageOrderChange]);
  const handleDragEnd = useCallback(() => { dragItem.current = null; dragOverItem.current = null; }, []);

  const toggleSlotSelection = useCallback((slotIndex: number) => {
    setSelectedSlots((prev) =>
      prev.includes(slotIndex) ? prev.filter((i) => i !== slotIndex) : [...prev, slotIndex]
    );
  }, []);
  const clearSlotSelection = useCallback(() => setSelectedSlots([]), []);
  const removeSelectedSlots = useCallback(() => {
    applyPageOrderChange((prev) => prev.filter((_, idx) => !selectedSlots.includes(idx)));
    setSelectedSlots([]);
  }, [selectedSlots, applyPageOrderChange]);
  const keepOnlySelectedSlots = useCallback(() => {
    applyPageOrderChange((prev) => prev.filter((_, idx) => selectedSlots.includes(idx)));
    setSelectedSlots([]);
  }, [selectedSlots, applyPageOrderChange]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const undoPageOrder = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextPrev = [...prev];
      const restored = nextPrev.pop()!;
      setRedoStack((redoPrev) => [...redoPrev, pageOrder]);
      setPageOrder(restored);
      setSelectedSlots([]);
      return nextPrev;
    });
  }, [pageOrder]);
  const redoPageOrder = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextPrev = [...prev];
      const restored = nextPrev.pop()!;
      setUndoStack((undoPrev) => [...undoPrev, pageOrder]);
      setPageOrder(restored);
      setSelectedSlots([]);
      return nextPrev;
    });
  }, [pageOrder]);

  const pageCountSafe = pageCount ?? thumbnails.length;
  const canGoPrev = currentPage > 0;
  const canGoNext = pageCountSafe > 0 && currentPage < pageCountSafe - 1;
  const goPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);
  const goNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(Math.max(0, pageCountSafe - 1), prev + 1));
  }, [pageCountSafe]);

  return {
    editPageImage,
    activeTool,
    setActiveTool,
    isReordering,
    setIsReordering,
    isSplitView,
    toggleSplitView,
    referenceFile,
    setReferenceFile,
    comparePreviewUrl,
    pageOrder,
    selectedSlots,
    toggleSlotSelection,
    clearSlotSelection,
    removeSelectedSlots,
    keepOnlySelectedSlots,
    canUndo,
    canRedo,
    undoPageOrder,
    redoPageOrder,
    setPageOrder,
    thumbnails,
    currentPage,
    pageCountSafe,
    canGoPrev,
    canGoNext,
    goPrevPage,
    goNextPage,
    applyAnnotation,
    handleSaveReorder,
    handleDragStart,
    handleDragOverSlot,
    handleDropSlot,
    handleDragEnd,
    getRootProps,
    getInputProps,
    isDragActive,
    isDrawing,
    currentRect,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
