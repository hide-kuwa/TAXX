import type { ComponentType } from "react";
import type { PersonaDefinition, PersonaId } from "@/config/personas";
import type { ScreenDesignPersona } from "@/config/screen-design-types";
import type { DocugridUser } from "@/lib/auth";
import { ClientAccountingHome } from "./ClientAccountingHome";

export type PersonaHomeProps = {
  persona: PersonaDefinition;
  user: DocugridUser | null;
  design: ScreenDesignPersona | null;
};

const PERSONA_HOMES: Partial<Record<PersonaId, ComponentType<PersonaHomeProps>>> = {
  client_accounting: ClientAccountingHome,
};

export const resolvePersonaHome = (
  personaId: PersonaId,
): ComponentType<PersonaHomeProps> | undefined => PERSONA_HOMES[personaId];
