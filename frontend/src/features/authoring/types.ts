/** 文書ひな形（Global / Local）— document-templates（並び順）とは別 */

export type AuthoringTemplateScope = "global" | "local";

export type AuthoringTemplate = {
  id: string;
  scope: AuthoringTemplateScope;
  title: string;
  description: string;
  category: string;
  body: string;
  variables: string[];
  version: string;
  updatedAt?: string;
  firmId?: string;
};

export type AuthoringTemplateListResponse = {
  global: AuthoringTemplate[];
  local: AuthoringTemplate[];
};

export type AuthoringRenderResult = {
  renderedBody: string;
  resolvedValues: Record<string, string>;
  missingVariables: string[];
  templateId: string;
  templateTitle?: string;
};

export const BUILTIN_VARIABLE_LABELS: Record<string, string> = {
  client_name: "顧問先名",
  client_id: "顧問先ID",
  fiscal_month: "決算月",
  today: "作成日",
};

export function labelForVariable(name: string): string {
  return BUILTIN_VARIABLE_LABELS[name] ?? name;
}

export function isBuiltinVariable(name: string): boolean {
  return name in BUILTIN_VARIABLE_LABELS;
}
