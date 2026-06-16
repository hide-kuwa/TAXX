import type { AppPermission } from "@/config/organization";
import type { PersonaId } from "@/config/personas";
import type { DocugridUser } from "./auth";
import { hasPermission } from "./authorization";
import { resolvePersonaId } from "./persona";

const FIRM_PERSONA_IDS: PersonaId[] = [
  "firm_director",
  "firm_staff_main",
  "firm_staff_support",
];

export const canShowSettingsNav = (user: DocugridUser | null): boolean =>
  hasPermission(user, "settings.manage") || hasPermission(user, "settings.platform");

export const canShowTasksNav = (user: DocugridUser | null): boolean => {
  if (!user) return false;
  if (!hasPermission(user, "dashboard.view")) return false;
  const personaId = resolvePersonaId(user);
  return FIRM_PERSONA_IDS.includes(personaId);
};

export const canAccessSettingsPage = (user: DocugridUser | null): boolean =>
  canShowSettingsNav(user);

export type SettingsCategoryId =
  | "clients"
  | "stakeholders"
  | "roles"
  | "documents"
  | "templates"
  | "screens"
  | "integrations"
  | "audit";

const CATEGORY_PERMISSIONS: Record<SettingsCategoryId, AppPermission> = {
  clients: "settings.manage",
  stakeholders: "settings.manage",
  documents: "settings.manage",
  templates: "settings.manage",
  screens: "settings.manage",
  audit: "settings.manage",
  roles: "settings.platform",
  integrations: "settings.platform",
};

export const canViewSettingsCategory = (
  user: DocugridUser | null,
  categoryId: SettingsCategoryId,
): boolean => hasPermission(user, CATEGORY_PERMISSIONS[categoryId]);

export const visibleSettingsCategories = (
  user: DocugridUser | null,
): SettingsCategoryId[] =>
  (Object.keys(CATEGORY_PERMISSIONS) as SettingsCategoryId[]).filter((id) =>
    canViewSettingsCategory(user, id),
  );
