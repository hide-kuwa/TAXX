import { loadAccessToken, loadCurrentUser } from "./auth";

const CLIENT_SCOPE_KEY = "docugrid.currentClientId";

export const setClientScope = (clientId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_SCOPE_KEY, clientId);
};

const loadClientScope = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CLIENT_SCOPE_KEY) ?? "";
};

/**
 * API 認証ヘッダ。JWT がある場合は Bearer のみ（+ 顧客スコープ）。
 * ヘッダフォールバックは未ログイン/開発用テスト向け。
 */
export const buildAuthHeaders = (): HeadersInit => {
  const token = loadAccessToken();
  const clientId = loadClientScope();
  const headers: Record<string, string> = {};

  if (clientId) {
    headers["X-Docugrid-Client"] = clientId;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  const user = loadCurrentUser();
  headers["X-Docugrid-Role"] = user?.appRoleId ?? "";
  headers["X-Docugrid-User"] = user?.email ?? "";
  headers["X-Docugrid-Stakeholder"] = user?.stakeholderId ?? "";
  return headers;
};
