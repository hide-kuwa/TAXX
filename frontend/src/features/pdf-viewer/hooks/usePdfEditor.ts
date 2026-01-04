import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ToolType } from "../types";

type UsePdfEditorParams = {
  file: File | null;
  pdfUrl: string | null;
  isOpen: boolean;
  pageCount: number | null;
  onHighlight: (
    type: "box" | "marker" | "line" | "check",
    page: number,
    rect: { x: number; y: number; w: number; h: number }
  ) => Promise<File | void>;
  onReorder: (newOrder: number[]) => Promise<File | void>;
  onMerge: (files: File[]) => Promise<File | void>;
  onGetThumbnails: () => Promise<string[]>;
  onRenderPage: (page: number, fileOverride?: File) => Promise<string | null>;
  recordAction: (newFile: File | void, actionName: string) => void;
};

type Rect = { x: number; y: number; w: number; h: number };

type Pos = { x: number; y: number };

export const usePdfEditor = ({
  file,
  pdfUrl,
  isOpen,
  pageCount,
  onHighlight,
  onReorder,
  onMerge,
  onGetThumbnails,
  onRenderPage,
  recordAction,
}: UsePdfEditorParams) => {
  const [isReordering, setIsReordering] = useState(false);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("none");
  const [editPageImage, setEditPageImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Pos | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsReordering(false);
      setActiveTool("none");
    }
  }, [isOpen]);

  useEffect(() => {
    if (pageCount) setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
  }, [pageCount]);

  useEffect(() => {
    if (isOpen && file) {
      onGetThumbnails().then((imgs) => setThumbnails(imgs));
    }
  }, [file, pdfUrl, isOpen, onGetThumbnails]);

  useEffect(() => {
    if (activeTool !== "none" && !editPageImage) {
      onRenderPage(0).then((url) => {
        if (url) setEditPageImage(url);
      });
    }
  }, [activeTool, onRenderPage, editPageImage]);

  const onDropAppend = async (acceptedFiles: File[]) => {
    if (!file || acceptedFiles.length === 0) return;
    const newFile = await onMerge([file, ...acceptedFiles]);
    if (newFile) recordAction(newFile, `PDF結合 (+${acceptedFiles.length}ファイル)`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAppend,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    noClick: true,
  });

  const applyAnnotation = async (type: ToolType, rect: Rect) => {
    if (type === "none" || !file) return;
    const newFile = await onHighlight(type, 0, rect);
    if (newFile) {
      let actionName = "";
      if (type === "marker") actionName = "マーカー";
      if (type === "box") actionName = "赤枠";
      if (type === "line") actionName = "ライン";
      if (type === "check") actionName = "チェック";

      recordAction(newFile, actionName);
      const newImg = await onRenderPage(0, newFile as File);
      if (newImg) setEditPageImage(newImg);
    }
  };

  const handleSaveReorder = async () => {
    if (!file) return;
    const newFile = await onReorder(pageOrder);
    if (newFile) {
      recordAction(newFile, "ページ並べ替え");
      setIsReordering(false);
    }
  };

  const getNormalizedPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "none" || activeTool === "check") return;
    setIsDrawing(true);
    const pos = getNormalizedPos(e);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;
    const pos = getNormalizedPos(e);
    setCurrentRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (activeTool === "check") {
      const pos = getNormalizedPos(e);
      await applyAnnotation("check", { x: pos.x - 0.025, y: pos.y - 0.025, w: 0.05, h: 0.05 });
      return;
    }
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 0.01 || currentRect.h > 0.01) await applyAnnotation(activeTool, currentRect);
    setStartPos(null);
    setCurrentRect(null);
  };

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    dragOverItem.current = position;
    if (dragItem.current !== null && dragItem.current !== position) {
      const newOrder = [...pageOrder];
      const draggedContent = newOrder[dragItem.current];
      newOrder.splice(dragItem.current, 1);
      newOrder.splice(position, 0, draggedContent);
      setPageOrder(newOrder);
      dragItem.current = position;
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return {
    isReordering,
    setIsReordering,
    pageOrder,
    thumbnails,
    zoomImage,
    setZoomImage,
    activeTool,
    setActiveTool,
    editPageImage,
    isDrawing,
    currentRect,
    canvasRef,
    getRootProps,
    getInputProps,
    isDragActive,
    handleSaveReorder,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
  };
};
