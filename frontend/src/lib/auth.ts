import { AppRoleId } from "@/config/organization";

export const DOCUGRID_USER_KEY = "docugrid.currentUser";
export const DOCUGRID_ACCESS_TOKEN_KEY = "docugrid.accessToken";

export const saveAccessToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOCUGRID_ACCESS_TOKEN_KEY, token);
};

export const loadAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DOCUGRID_ACCESS_TOKEN_KEY);
};

export const clearAccessToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DOCUGRID_ACCESS_TOKEN_KEY);
};

export const clearCurrentUser = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DOCUGRID_USER_KEY);
};

export const clearAuthSession = (): void => {
  if (typeof window === "undefined") return;
  clearAccessToken();
  clearCurrentUser();
  localStorage.removeItem("docugrid.currentClientId");
};

export type DocugridUser = {
  email: string;
  name: string;
  stakeholderId?: string;
  appRoleId?: AppRoleId;
};

export const saveCurrentUser = (user: DocugridUser): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOCUGRID_USER_KEY, JSON.stringify(user));
};

export const loadCurrentUser = (): DocugridUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DOCUGRID_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DocugridUser>;
    if (!parsed.email) return null;
    return {
      email: parsed.email,
      name: parsed.name || parsed.email,
      stakeholderId: parsed.stakeholderId,
      appRoleId: parsed.appRoleId,
    };
  } catch {
    return null;
  }
};
