const DEFAULT_API_BASE = "http://localhost:3100/api";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE}/pdf/info`,
  HIGHLIGHT: `${API_BASE}/highlight`,
  REORDER: `${API_BASE}/edit/reorder`,
  MERGE: `${API_BASE}/edit/merge`,
  THUMBNAILS: `${API_BASE}/pdf/thumbnails`,
  RENDER_PAGE: `${API_BASE}/pdf/render`,
} as const;
