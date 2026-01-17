import { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ToolType } from "../types";

interface UsePdfEditorProps {
  file: File | null;
  pdfUrl: string | null;
  editorKey: string;
  pageCount: number | null;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
  onHighlight: (type: ToolType, page: number, rect: any) => Promise<File | void>;
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
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  const [editPageImage, setEditPageImage] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  
  const [activeTool, setActiveTool] = useState<ToolType>("none");
  const [isReordering, setIsReordering] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [comparePreviewUrl, setComparePreviewUrl] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);

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
          setInternalPreviewUrl(null);
          setEditPageImage(null);
          setThumbnails([]);
          setReferenceFile(null);
        }
        return;
      }

      // 2. 基本情報のロード (URL)
      // 親からURLが渡されていればそれを優先、なければBlob生成
      if (pdfUrl) {
         setInternalPreviewUrl(prev => prev === pdfUrl ? prev : pdfUrl);
      } else {
         const blobUrl = URL.createObjectURL(fileRef.current);
         setInternalPreviewUrl(blobUrl);
      }

      // 3. 重たい処理 (サムネイル & 編集用画像)
      try {
        const [imgs, pageImg] = await Promise.all([
          handlersRef.current.onGetThumbnails(),
          handlersRef.current.onRenderPage(0)
        ]);

        if (isMounted) {
          setThumbnails(imgs);
          if (pageImg) setEditPageImage(pageImg);
        }
      } catch (error) {
        console.error("Failed to initialize PDF editor:", error);
      }
    };

    initializeEditor();

    return () => { isMounted = false; };
  }, [editorKey, pdfUrl]); // pdfUrlの変更も検知するが、内部で値チェックを行うため安全

  // ページ数が変わった時だけオーダーをリセット
  useEffect(() => {
    if (pageCount) {
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
    }
  }, [pageCount]);

  // ========================================================================
  // 4. アクションハンドラー (依存配列は空にする)
  // ========================================================================

  const applyAnnotation = useCallback(async (type: ToolType, rect: any) => {
    const currentFile = fileRef.current;
    if (type === "none" || !currentFile) return;
    
    // 処理実行
    const newFile = await handlersRef.current.onHighlight(type, 0, rect);
    
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
      const newImg = await handlersRef.current.onRenderPage(0, newFile as File);
      if (newImg) setEditPageImage(newImg);
      
      const newUrl = URL.createObjectURL(newFile as File);
      setInternalPreviewUrl(newUrl);
    }
  }, []);

  const handleSaveReorder = useCallback(async () => {
    if (!fileRef.current) return;
    const newFile = await handlersRef.current.onReorder(pageOrder);
    if (newFile) {
      handlersRef.current.recordAction(newFile as File, "ページ並べ替え");
      setIsReordering(false);
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
  const handleDragStart = useCallback((e: React.DragEvent, position: number) => { dragItem.current = position; }, []);
  const handleDragEnter = useCallback((e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
    if (dragItem.current !== null && dragItem.current !== position) {
      setPageOrder(prev => {
        const newOrder = [...prev];
        const draggedItem = newOrder[dragItem.current!];
        newOrder.splice(dragItem.current!, 1);
        newOrder.splice(position, 0, draggedItem);
        dragItem.current = position;
        return newOrder;
      });
    }
  }, []);
  const handleDragEnd = useCallback(() => { dragItem.current = null; dragOverItem.current = null; }, []);

  return {
    internalPreviewUrl,
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
    setPageOrder,
    thumbnails,
    applyAnnotation,
    handleSaveReorder,
    handleDragStart,
    handleDragEnter,
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
