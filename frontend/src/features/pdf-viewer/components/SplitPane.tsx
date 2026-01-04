import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";

type SplitPaneProps = {
  referenceFile: File | null;
  setReferenceFile: (file: File | null) => void;
  comparePreviewUrl: string | null;
};

export const SplitPane = ({ referenceFile, setReferenceFile, comparePreviewUrl }: SplitPaneProps) => {
  const onDropReference = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setReferenceFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropReference,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`w-1/2 border-r border-slate-300 bg-slate-200 relative flex flex-col transition-colors ${
        isDragActive ? "bg-blue-100 ring-inset ring-4 ring-blue-400" : ""
      }`}
    >
      <input {...getInputProps()} />
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <div className="bg-slate-800/80 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur flex items-center gap-2">
          <span>{referenceFile ? `Ref: ${referenceFile.name}` : "Comparison: Previous Ver"}</span>
          {referenceFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReferenceFile(null);
              }}
              className="hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {comparePreviewUrl ? (
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
