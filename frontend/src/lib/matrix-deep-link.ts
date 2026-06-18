/** マトリクス画面へのディープリンク（顧客 × 期 × スロット）。 */

export type MatrixDeepLinkParams = {
  clientId: string;
  periodKey: string;
  slotId: string;
};

export function buildMatrixDeepLink(params: MatrixDeepLinkParams): string {
  const q = new URLSearchParams({
    client: params.clientId,
    period: params.periodKey,
    slot: params.slotId,
  });
  return `/?${q.toString()}`;
}

export function parseMatrixDeepLink(search: string): MatrixDeepLinkParams | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const clientId = q.get("client");
  const periodKey = q.get("period");
  const slotId = q.get("slot");
  if (!clientId || !periodKey || !slotId) return null;
  return { clientId, periodKey, slotId };
}
