export type SlotLayout = {
  labels: string[];
  order: number[];
};

const STORAGE_KEY = "taxx-slot-layout:v1";

function isValidOrder(order: number[], n: number): boolean {
  if (order.length !== n) return false;
  const set = new Set(order);
  if (set.size !== n) return false;
  for (let i = 0; i < n; i++) {
    if (!set.has(i)) return false;
  }
  return true;
}

export function loadAllSlotLayouts(): Record<string, SlotLayout> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SlotLayout>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function persistSlotLayout(layoutKey: string, layout: SlotLayout): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadAllSlotLayouts();
    all[layoutKey] = layout;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
}

export function resolveSlotLayout(
  layoutKey: string,
  defaultLabels: string[],
  stored: Record<string, SlotLayout>,
): SlotLayout {
  const n = defaultLabels.length;
  const baseOrder = Array.from({ length: n }, (_, i) => i);
  const saved = stored[layoutKey];
  if (!saved || saved.labels.length !== n || !isValidOrder(saved.order, n)) {
    return { labels: [...defaultLabels], order: baseOrder };
  }
  return { labels: [...saved.labels], order: [...saved.order] };
}
