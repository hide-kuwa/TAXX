"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadStatus } from "@/features/pdf-viewer/types";
import { STAFF_DATA } from "@/components/mockData";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import MatrixGrid from "@/components/MatrixGrid";
import ViewerModal from "@/features/pdf-viewer";
import { API_BASE, API_ENDPOINTS } from "@/config/api";
import { clearAuthSession, loadAccessToken, loadCurrentUser } from "@/lib/auth";
import { buildAuthHeaders, setClientScope } from "@/lib/api-auth";
import { canAccessClient, hasPermission, resolveStakeholder } from "@/lib/authorization";

export default function DocuGridPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof loadCurrentUser>>(null);
  const [activeStaffIdx, setActiveStaffIdx] = useState(0);
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"year" | "month">("year");
  const [activePeriodIdx, setActivePeriodIdx] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const currentStaff = STAFF_DATA[activeStaffIdx];
  const stakeholder = resolveStakeholder(currentUser);
  const scopedClients = currentStaff.clients.filter((client) => canAccessClient(stakeholder, client.id));
  const effectiveStaff = { ...currentStaff, clients: scopedClients };
  const currentClient = effectiveStaff.clients[activeClientIdx] || {
    fiscal: 3, name: "Unknown", role: "main", id: "unknown",
  };
  const canViewDocument = hasPermission(currentUser, "document.view");
  const canUploadDocument = hasPermission(currentUser, "document.upload");
  const canAnnotateDocument = hasPermission(currentUser, "document.annotate");
  const canApproveAudit = hasPermission(currentUser, "audit.approve");
  const currentGroups = currentClient.groupLabels ?? [];
  const relatedClients = effectiveStaff.clients
    .filter((client) => {
      if (client.id === currentClient.id) return false;
      if (!client.groupLabels?.length || currentGroups.length === 0) return false;
      return client.groupLabels.some((group) => currentGroups.includes(group));
    })
    .map((client) => ({
      id: client.id,
      name: client.name,
      relation: Array.from(new Set(client.relationLabels ?? [])).join(" / "),
    }));

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const user = loadCurrentUser();
      const token = loadAccessToken();
      if (!user || !token) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        if (!active) return;
        setCurrentUser(user);
        setAuthChecked(true);
      } catch {
        clearAuthSession();
        router.replace("/login");
      }
    };
    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    return () => clearPreviewUrl(pdfUrl);
  }, [pdfUrl, clearPreviewUrl]);

  useEffect(() => {
    if (activeClientIdx >= effectiveStaff.clients.length) {
      setActiveClientIdx(0);
    }
  }, [activeClientIdx, effectiveStaff.clients.length]);

  useEffect(() => {
    if (currentClient?.id && currentClient.id !== "unknown") {
      setClientScope(currentClient.id);
    }
  }, [currentClient?.id]);

  const onStaffChange = (direction: 1 | -1) => {
    setActiveStaffIdx((prev) => {
      let next = prev + direction;
      if (next >= STAFF_DATA.length) next = 0;
      if (next < 0) next = STAFF_DATA.length - 1;
      return next;
    });
    setActiveClientIdx(0);
  };

  const onSelectRelatedClient = (clientId: string) => {
    const nextIdx = effectiveStaff.clients.findIndex((client) => client.id === clientId);
    if (nextIdx >= 0) {
      setActiveClientIdx(nextIdx);
    }
  };

  const uploadFile = useCallback(async (selectedFile: File) => {
    if (!canUploadDocument) {
      alert("アップロード権限がありません。");
      return;
    }
    setUploadStatus("uploading");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      const count = data.page_count ?? data.pageCount;
      setPageCount(typeof count === "number" ? count : null);
      setUploadStatus("success");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [canUploadDocument]);

  const onFilesDropped = useCallback((acceptedFiles: File[]) => {
    if (!canUploadDocument) return;
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    clearPreviewUrl(pdfUrl);
    setPdfUrl(URL.createObjectURL(selectedFile));
    setIsViewerOpen(true);
    uploadFile(selectedFile);
  }, [canUploadDocument, clearPreviewUrl, pdfUrl, uploadFile]);

  const handleHighlight = useCallback(async (
    type: "box" | "marker" | "line" | "check",
    pageIdx: number,
    rect: { x: number, y: number, w: number, h: number },
    options?: { file?: File; updatePrimary?: boolean }
  ) => {
    const targetFile = options?.file ?? file;
    if (!targetFile) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      formData.append("page", pageIdx.toString());
      formData.append("x", rect.x.toString());
      formData.append("y", rect.y.toString());
      formData.append("w", rect.w.toString()); 
      formData.append("h", rect.h.toString()); 
      formData.append("type", type);

      const response = await fetch(API_ENDPOINTS.HIGHLIGHT, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error(`${type} action failed`);
      const blob = await response.blob();
      const updatedFile = new File([blob], `processed_${targetFile.name}`, { type: blob.type || "application/pdf" });
      if (options?.updatePrimary !== false) {
        setFile(updatedFile);
        clearPreviewUrl(pdfUrl);
        setPdfUrl(URL.createObjectURL(updatedFile));
      }
      return updatedFile;
    } catch (error) {
      console.error(error);
      alert(`${type}処理に失敗しました。`);
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl]);

  const handleReorder = useCallback(async (newOrderIndices: number[]) => {
    if (!file || !canAnnotateDocument) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const orderStr = newOrderIndices.join(",");
      formData.append("order", orderStr);
      const response = await fetch(API_ENDPOINTS.REORDER, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error("Reorder failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `reordered_${file.name}`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
      return updatedFile;
    } catch (error) {
      alert("並べ替え処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfUrl, clearPreviewUrl, canAnnotateDocument]);

  const handleMerge = useCallback(async (filesToMerge: File[]) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      filesToMerge.forEach(f => formData.append("files", f));
      const response = await fetch(API_ENDPOINTS.MERGE, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) throw new Error("Merge failed");
      const blob = await response.blob();
      const updatedFile = new File([blob], `merged.pdf`, { type: blob.type || "application/pdf" });
      setFile(updatedFile);
      clearPreviewUrl(pdfUrl);
      setPdfUrl(URL.createObjectURL(updatedFile));
      return updatedFile;
    } catch (error) {
      alert("結合処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [pdfUrl, clearPreviewUrl]);

  const handleGetThumbnails = useCallback(async () => {
    if (!file) return [];
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(API_ENDPOINTS.THUMBNAILS, {
        method: "POST",
        body: formData,
        headers: buildAuthHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (data.thumbnails && data.thumbnails.length > 0) {
        setPageCount(data.thumbnails.length);
      }
      return data.thumbnails as string[];
    } catch (error) {
      return [];
    }
  }, [file]);

  // ★修正: 第2引数で fileOverride を受け取れるように変更
  // これにより、State更新を待たずに「今できたファイル」で即時レンダリングできる
  const handleRenderPage = useCallback(async (pageIdx: number, fileOverride?: File) => {
    const targetFile = fileOverride || file;
    if (!targetFile) return null;
    
    try {
        const formData = new FormData();
        formData.append("file", targetFile);
        formData.append("page", pageIdx.toString());
        const response = await fetch(API_ENDPOINTS.RENDER_PAGE, {
          method: "POST",
          body: formData,
          headers: buildAuthHeaders(),
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Render Page Error:", error);
        return null;
    }
  }, [file]);

  const progressPercent = activePeriodIdx === 0 ? 100 : file ? 50 : 0;

  if (!authChecked) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-600 overflow-hidden font-sans select-none">
      <NavBar currentStaff={effectiveStaff} activeClientIdx={activeClientIdx} onClientChange={setActiveClientIdx} onStaffChange={onStaffChange} onStaffSwitch={() => onStaffChange(1)} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar activeMode={activeMode} activePeriodIdx={activePeriodIdx} onPeriodChange={setActivePeriodIdx} onModeSwitch={() => { setActiveMode((prev) => (prev === "year" ? "month" : "year")); setActivePeriodIdx(1); }} />
        <MatrixGrid
          currentClient={currentClient}
          activePeriodIdx={activePeriodIdx}
          activeMode={activeMode}
          file={file}
          progressPercent={progressPercent}
          onFilesDropped={onFilesDropped}
          onOpenFile={() => setIsViewerOpen(true)}
          relatedClients={relatedClients}
          onSelectRelatedClient={onSelectRelatedClient}
          canUpload={canUploadDocument}
          canView={canViewDocument}
        />
        <ViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          file={file}
          pdfUrl={pdfUrl}
          pageCount={pageCount}
          uploadStatus={uploadStatus}
          isLoading={isLoading}
          onHighlight={handleHighlight}
          onReorder={handleReorder}
          onMerge={handleMerge}
          onGetThumbnails={handleGetThumbnails}
          onRenderPage={handleRenderPage}
          canAnnotate={canAnnotateDocument}
          canApprove={canApproveAudit}
        />
      </div>
    </div>
  );
}
