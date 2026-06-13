import {
  DEFAULT_PERSONA_ID,
  PERSONAS,
  STAKEHOLDER_PERSONA_BY_ID,
  type PersonaDefinition,
  type PersonaId,
} from "@/config/personas";
import type { DocugridUser } from "./auth";

export function resolvePersonaId(user: DocugridUser | null): PersonaId {
  if (!user) return DEFAULT_PERSONA_ID;
  if (user.personaId && PERSONAS.some((p) => p.id === user.personaId)) {
    return user.personaId as PersonaId;
  }
  if (user.stakeholderId && STAKEHOLDER_PERSONA_BY_ID[user.stakeholderId]) {
    return STAKEHOLDER_PERSONA_BY_ID[user.stakeholderId];
  }
  return DEFAULT_PERSONA_ID;
}

export function resolvePersona(user: DocugridUser | null): PersonaDefinition {
  return (
    PERSONAS.find((p) => p.id === resolvePersonaId(user)) ??
    PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)!
  );
}

export function getPostLoginPath(user: DocugridUser | null): string {
  return resolvePersona(user).homePath;
}

export function usesMatrixShell(user: DocugridUser | null): boolean {
  return resolvePersona(user).shell === "matrix";
}
