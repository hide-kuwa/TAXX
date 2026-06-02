import { useEffect, useState } from "react";
import {
  CLIENTS,
  CLIENT_FAMILY_GROUPS,
  type ClientFamilyGroup,
  type OrgClient,
} from "@/config/organization";
import { API_BASE } from "@/config/api";
import { buildAuthHeaders } from "@/lib/api-auth";

export type OrgDirectory = {
  clients: OrgClient[];
  groups: ClientFamilyGroup[];
  /** true once the backend client-master has been merged in. */
  loaded: boolean;
};

/**
 * 顧客マスタ（顧客・関係グループ）をバックエンドから取得する。
 * 取得前・失敗時は config の既定値を返すため、UI は常に表示可能。
 * 設定画面（PUT /api/client-master）での編集がここに反映される。
 */
export function useOrgDirectory(): OrgDirectory {
  const [clients, setClients] = useState<OrgClient[]>(CLIENTS);
  const [groups, setGroups] = useState<ClientFamilyGroup[]>(CLIENT_FAMILY_GROUPS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/client-master`, {
          headers: buildAuthHeaders(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          clients?: OrgClient[];
          groups?: ClientFamilyGroup[];
        };
        if (!active) return;
        if (Array.isArray(data.clients) && data.clients.length > 0) {
          setClients(data.clients);
        }
        if (Array.isArray(data.groups)) {
          setGroups(data.groups);
        }
        setLoaded(true);
      } catch {
        // ネットワーク不通時は既定値を維持
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { clients, groups, loaded };
}
