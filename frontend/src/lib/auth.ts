import { AppRoleId } from "@/config/organization";

export const DOCUGRID_USER_KEY = "docugrid.currentUser";

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
