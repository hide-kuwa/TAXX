import { AlertCircle, ChevronLeft, ChevronRight, FileUp, Grip, Plus } from "lucide-react";
import { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";
import { ToolType } from "../types";

type Rect = { x: number; y: number; w: number; h: number } | null;

type MainCanvasProps = {
  isSplitView: boolean;
  isReordering: boolean;
  isLoading: boolean;
  pageOrder: number[];
  selectedSlots: number[];
  toggleSlotSelection: (slotIndex: number) => void;
  clearSlotSelection: () => void;
  removeSelectedSlots: () => void;
  keepOnlySelectedSlots: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoPageOrder: () => void;
  redoPageOrder: () => void;
  currentPage: number;
  pageCountSafe: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  goPrevPage: () => void;
  goNextPage: () => void;
  thumbnails: string[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  handleSaveReorder: () => void;
  handleDragStart: (e: React.DragEvent, position: number) => void;
  handleDragOverSlot: (e: React.DragEvent, position: number) => void;
  handleDropSlot: (e: React.DragEvent, position: number) => void;
  handleDragEnd: () => void;
  activeTool: ToolType;
  editPageImage: string | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  isDrawing: boolean;
  currentRect: Rect;
};

export const MainCanvas = ({
  isSplitView,
  isReordering,
  isLoading,
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
  currentPage,
  pageCountSafe,
  canGoPrev,
  canGoNext,
  goPrevPage,
  goNextPage,
  thumbnails,
  getRootProps,
  getInputProps,
  isDragActive,
  handleSaveReorder,
  handleDragStart,
  handleDragOverSlot,
  handleDropSlot,
  handleDragEnd,
  activeTool,
  editPageImage,
  canvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  isDrawing,
  currentRect,
}: MainCanvasProps) => {
  return (
    <div className={`relative flex flex-col ${isSplitView ? "w-1/2" : "w-full"}`}>
      {isReordering ? (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-100">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-700">ページ並べ替え・追加</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={removeSelectedSlots}
                  disabled={selectedSlots.length === 0 || isLoading}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  選択を削除
                </button>
                <button
                  onClick={keepOnlySelectedSlots}
                  disabled={selectedSlots.length === 0 || isLoading}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  選択だけ残す(分割)
                </button>
                <button
                  onClick={clearSlotSelection}
                  disabled={selectedSlots.length === 0 || isLoading}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  選択解除
                </button>
                <button
                  onClick={undoPageOrder}
                  disabled={!canUndo || isLoading}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Undo
                </button>
                <button
                  onClick={redoPageOrder}
                  disabled={!canRedo || isLoading}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Redo
                </button>
                <button
                  onClick={handleSaveReorder}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-500 shadow-lg"
                >
                  {isLoading ? "処理中..." : <><FileUp className="h-4 w-4" /> 確定</>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pageOrder.map((pageIndex, i) => (
                <div
                  key={pageIndex}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOverSlot(e, i)}
                  onDrop={(e) => handleDropSlot(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`aspect-[1/1.4] bg-white rounded-lg border-2 shadow-sm flex flex-col items-center cursor-move hover:border-blue-400 hover:shadow-md transition-all relative group overflow-hidden ${
                    selectedSlots.includes(i) ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSlotSelection(i);
                    }}
                    className={`absolute top-2 right-2 z-10 h-5 w-5 rounded border text-[10px] font-bold ${
                      selectedSlots.includes(i) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-300"
                    }`}
                  >
                    {selectedSlots.includes(i) ? "✓" : ""}
                  </button>
                  <div className="absolute top-2 left-2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 z-10">
                    {i + 1}
                  </div>
                  <div className="w-full h-full p-2 flex items-center justify-center bg-slate-50">
                    {thumbnails[pageIndex] ? (
                      <img src={thumbnails[pageIndex]} className="max-h-full max-w-full object-contain pointer-events-none" />
                    ) : (
                      "Loading..."
                    )}
                  </div>
                  <Grip className="absolute bottom-2 right-2 h-4 w-4 text-slate-400 z-10" />
                </div>
              ))}
              <div
                {...getRootProps()}
                className={`aspect-[1/1.4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? "bg-blue-50 border-blue-500" : "bg-slate-100 border-slate-300 hover:bg-white hover:border-blue-400"
                }`}
              >
                <input {...getInputProps()} />
                <Plus className={`h-8 w-8 mb-2 ${isDragActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-xs font-bold ${isDragActive ? "text-blue-600" : "text-slate-400"}`}>
                  {isDragActive ? "Drop PDF" : "Add PDF"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white">
            <button
              type="button"
              onClick={goPrevPage}
              disabled={!canGoPrev}
              className="rounded p-1 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{pageCountSafe > 0 ? `${currentPage + 1} / ${pageCountSafe}` : "- / -"}</span>
            <button
              type="button"
              onClick={goNextPage}
              disabled={!canGoNext}
              className="rounded p-1 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {activeTool !== "none" ? (
            <div
              className="relative shadow-2xl bg-white select-none"
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: activeTool === "check" ? "copy" : "crosshair" }}
            >
              {editPageImage ? (
                <img src={editPageImage} className="max-h-[80vh] w-auto pointer-events-none" />
              ) : (
                <div className="h-[80vh] w-[50vh] flex items-center justify-center">
                  <p>Loading Page...</p>
                </div>
              )}
              {isDrawing && currentRect && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-200/30"
                  style={{
                    left: `${currentRect.x * 100}%`,
                    top: `${currentRect.y * 100}%`,
                    width: `${currentRect.w * 100}%`,
                    height: `${currentRect.h * 100}%`,
                  }}
                ></div>
              )}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-xs font-bold pointer-events-none">
                編集モード: {activeTool.toUpperCase()} (Page {currentPage + 1})
              </div>
            </div>
          ) : editPageImage ? (
            <img src={editPageImage} className="max-h-[80vh] w-auto shadow-2xl bg-white" />
          ) : (
            <div className="opacity-50">
              <AlertCircle className="h-24 w-24 text-slate-300" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
