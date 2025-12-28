"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type Props = {
    file: File;
    activeTool: 'box' | 'marker';
    onEdit: (x: number, y: number, pageIndex: number) => void;
};

export default function PdfViewer({ file, activeTool, onEdit }: Props) {
    const [currentPageIdx, setCurrentPageIdx] = useState(0);
    const [pageWidth, setPageWidth] = useState(0);
    const pageWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = pageWrapperRef.current;
        if (!wrapper) return;
        const updateWidth = () => setPageWidth(wrapper.clientWidth);
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [file]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = pageWrapperRef.current ?? e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        console.log("PDF click", { x, y, pageIndex: currentPageIdx, tool: activeTool });
        onEdit(x, y, currentPageIdx);
    };

    const handlePageLoadSuccess = (page: PDFPageProxy) => {
        setCurrentPageIdx(page.pageNumber - 1);
    };

    return (
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-900/50 h-full">
            <div className="relative shadow-2xl cursor-crosshair group h-fit w-full max-w-5xl">
                <div ref={pageWrapperRef} onClick={handleClick} className="hover:bg-blue-500/10 transition-colors">
                    <Document
                        file={file}
                        loading={<div className="flex justify-center mt-20 text-white"><Loader2 className="animate-spin" size={40}/></div>}
                    >
                        <Page
                            pageNumber={1}
                            width={pageWidth || undefined}
                            onLoadSuccess={handlePageLoadSuccess}
                            loading={<div className="flex justify-center mt-20 text-white"><Loader2 className="animate-spin" size={40}/></div>}
                        />
                    </Document>
                </div>
            </div>
        </div>
    );
}
