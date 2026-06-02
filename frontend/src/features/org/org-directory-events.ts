/** 顧客マスタ保存後に useOrgDirectory 等へ再取得を促す。 */
export const ORG_DIRECTORY_RELOAD_EVENT = "docugrid:org-directory-reload";

export function dispatchOrgDirectoryReload(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ORG_DIRECTORY_RELOAD_EVENT));
}
