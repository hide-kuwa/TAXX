import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ToolType } from "../types";
import { PDFPaneHeader } from "./PDFPaneHeader";

type AuditSplitPaneProps = {
  referenceFile: File | null;
  setReferenceFile: (file: File | null) => void;
  comparePreviewUrl: string | null;
  referencePageImage: string | null;
  activeTool: ToolType;
  referenceCanvasRef: React.RefObject<HTMLDivElement>;
  onReferenceMouseDown: (e: React.MouseEvent) => void;
  onReferenceMouseMove: (e: React.MouseEvent) => void;
  onReferenceMouseUp: (e: React.MouseEvent) => void;
};

export const AuditSplitPane = ({
  referenceFile,
  setReferenceFile,
  comparePreviewUrl,
  referencePageImage,
  activeTool,
  referenceCanvasRef,
  onReferenceMouseDown,
  onReferenceMouseMove,
  onReferenceMouseUp,
}: AuditSplitPaneProps) => {
  const onDropReference = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setReferenceFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropReference,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
  });

  const showReferenceCanvas = activeTool === "check" && referencePageImage;
  const handleClearReference = () => {
    setReferenceFile(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`w-1/2 border-r border-slate-300 bg-slate-200 relative flex flex-col transition-colors ${
        isDragActive ? "bg-blue-100 ring-inset ring-4 ring-blue-400" : ""
      }`}
    >
      <input {...getInputProps()} />
      <PDFPaneHeader
        title="Reference View"
        fileName={referenceFile?.name}
        onOpen={handleClearReference}
        onClose={handleClearReference}
      />

      {showReferenceCanvas ? (
        <div className="flex-1 bg-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className="relative shadow-2xl bg-white select-none"
            ref={referenceCanvasRef}
            onMouseDown={onReferenceMouseDown}
            onMouseMove={onReferenceMouseMove}
            onMouseUp={onReferenceMouseUp}
            style={{ cursor: "copy" }}
          >
            <img src={referencePageImage} className="max-h-[80vh] w-auto pointer-events-none" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-xs font-bold pointer-events-none">
              参照チェックモード (Page 1)
            </div>
          </div>
        </div>
      ) : comparePreviewUrl ? (
        <embed src={comparePreviewUrl} type="application/pdf" className="flex-1 w-full h-full" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Upload className="h-12 w-12 mb-2 opacity-50" />
          <p className="font-bold">No previous version</p>
          <p className="text-xs">Drop a PDF here to compare</p>
        </div>
      )}

      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm z-20">
          <p className="text-white font-bold text-xl drop-shadow-md">Drop Reference PDF Here</p>
        </div>
      )}
    </div>
  );
};
