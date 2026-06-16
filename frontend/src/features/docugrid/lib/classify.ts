import { API_ENDPOINTS } from "@/config/api";
import { authFetch, buildAuthHeaders } from "@/lib/api-auth";

export type ClassifyCandidate = { id: string; label: string };

export type ClassifyRankedItem = {
  id: string;
  label: string;
  score: number;
  matched: string[];
};

export type ClassifyCapabilities = {
  ocr_auto_extract_enabled: boolean;
  ai_openai_enabled: boolean;
  ai_gemini_enabled: boolean;
  ai_openai_key_configured: boolean;
  ai_gemini_key_configured: boolean;
};

export type ClassifyResult = {
  best: ClassifyRankedItem | null;
  ranked: ClassifyRankedItem[];
  confidence: number;
  engine: "pymupdf" | "tesseract" | "none" | "openai" | "gemini" | string;
  text_excerpt: string;
  ai_reason?: string;
  capabilities?: ClassifyCapabilities;
};

export function describeClassifyCapabilities(cap?: ClassifyCapabilities): string | null {
  if (!cap) return null;
  if (!cap.ocr_auto_extract_enabled) {
    return "OCR 自動抽出が OFF です。ルール分類のみ動作します（管理者が設定で有効化できます）。";
  }
  const aiReady =
    (cap.ai_openai_enabled && cap.ai_openai_key_configured) ||
    (cap.ai_gemini_enabled && cap.ai_gemini_key_configured);
  if (!aiReady) {
    return "AI 補助分類は未設定です。確信度が低い書類は要確認キューに入ります。";
  }
  return null;
}

export type ClassifyPersistMetadata = {
  confidence: number;
  engine: string;
  best: ClassifyRankedItem | null;
  ranked: ClassifyRankedItem[];
  text_excerpt?: string;
  ai_reason?: string;
  classified_at: string;
};

export function toClassifyPersistMetadata(result: ClassifyResult): ClassifyPersistMetadata {
  return {
    confidence: result.confidence,
    engine: result.engine,
    best: result.best,
    ranked: result.ranked,
    text_excerpt: result.text_excerpt,
    ai_reason: result.ai_reason,
    classified_at: new Date().toISOString(),
  };
}

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
    headers: buildAuthHeaders(clientId),
    body: form,
  });
  if (!res.ok) throw new Error(`classify-failed:${res.status}`);
  return (await res.json()) as ClassifyResult;
}
