import { API_ENDPOINTS } from "@/config/api";
import { authFetch, buildAuthHeaders } from "@/lib/api-auth";

export type ClassifyCandidate = { id: string; label: string };

export type ClassifyRankedItem = {
  id: string;
  label: string;
  score: number;
  matched: string[];
};

export type ClassifyResult = {
  best: ClassifyRankedItem | null;
  ranked: ClassifyRankedItem[];
  confidence: number;
  engine: "pymupdf" | "tesseract" | "none";
  text_excerpt: string;
};

/**
 * PDF を OCR/テキスト抽出 → ルールベース分類し、候補スロットの推定を返す。
 */
export async function classifyDocument(
  file: File,
  candidates: ClassifyCandidate[],
  clientId?: string,
): Promise<ClassifyResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("candidates", JSON.stringify(candidates));
  if (clientId) form.append("client_id", clientId);

  const res = await authFetch(API_ENDPOINTS.CLASSIFY, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`classify-failed:${res.status}`);
  return (await res.json()) as ClassifyResult;
}
