import { API_ENDPOINTS } from "@/config/api";
import { authFetch, buildAuthHeaders } from "@/lib/api-auth";

export type SlotDocumentItem = {
  id: string;
  client_id: string;
  period_key: string;
  slot_id: string;
  slot_label: string | null;
  original_name: string;
  page_count: number | null;
  content_sha256: string;
  byte_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
  logical_document_id?: string | null;
  current_version_id?: string | null;
  current_version_label?: string | null;
  workflow_status?: string | null;
  docugrid_document_id?: string | null;
  logical_status?: string | null;
};

export type PersistSlotArgs = {
  clientId: string;
  periodKey: string;
  slotId: string;
  slotLabel: string;
  file: File;
};

/** Upload (or replace) the document stored in a client × period × slot. */
export async function persistSlotDocument({
  clientId,
  periodKey,
  slotId,
  slotLabel,
  file,
}: PersistSlotArgs): Promise<SlotDocumentItem> {
  const form = new FormData();
  form.append("client_id", clientId);
  form.append("period_key", periodKey);
  form.append("slot_id", slotId);
  form.append("slot_label", slotLabel);
  form.append("file", file);

  const res = await authFetch(API_ENDPOINTS.SLOTS, {
    method: "POST",
    body: form,
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`persist-slot-failed:${res.status}`);
  }
  return (await res.json()) as SlotDocumentItem;
}

/** List persisted documents for a client, optionally scoped to one period. */
export async function listSlotDocuments(
  clientId: string,
  periodKey?: string,
  signal?: AbortSignal,
): Promise<SlotDocumentItem[]> {
  const url = new URL(API_ENDPOINTS.SLOTS);
  url.searchParams.set("client_id", clientId);
  if (periodKey) url.searchParams.set("period_key", periodKey);

  const res = await authFetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`list-slots-failed:${res.status}`);
  }
  return (await res.json()) as SlotDocumentItem[];
}

/** Download the stored PDF bytes and rebuild a File for the viewer/editor. */
export async function fetchSlotDocumentFile(
  item: SlotDocumentItem,
  signal?: AbortSignal,
): Promise<File> {
  const res = await authFetch(API_ENDPOINTS.SLOT_FILE(item.id), {
    method: "GET",
    headers: buildAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`fetch-slot-file-failed:${res.status}`);
  }
  const blob = await res.blob();
  return new File([blob], item.original_name || "document.pdf", {
    type: "application/pdf",
  });
}

export async function deleteSlotDocument(docId: string): Promise<void> {
  const res = await authFetch(API_ENDPOINTS.SLOT_FILE(docId).replace(/\/file$/, ""), {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`delete-slot-failed:${res.status}`);
  }
}
