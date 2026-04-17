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

export const buildAuthHeaders = (): HeadersInit => {
  const user = loadCurrentUser();
  const token = loadAccessToken();
  const headers: Record<string, string> = {
    "X-Docugrid-Role": user?.appRoleId ?? "",
    "X-Docugrid-User": user?.email ?? "",
    "X-Docugrid-Stakeholder": user?.stakeholderId ?? "",
    "X-Docugrid-Client": loadClientScope(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};
