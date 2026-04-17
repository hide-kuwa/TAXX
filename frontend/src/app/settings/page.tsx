"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_ROLES,
  CLIENTS,
  CLIENT_FAMILY_GROUPS,
  DOCUMENT_CATEGORIES,
  RELATION_TYPE_LABEL,
  STAKEHOLDER_MASTER,
  type ClientRelationType,
  type StakeholderKind,
} from "@/config/organization";
import { API_BASE } from "@/config/api";
import { buildAuthHeaders } from "@/lib/api-auth";

type ConfigCategoryId = "clients" | "stakeholders" | "roles" | "documents" | "integrations" | "audit";

type ConfigCategory = {
  id: ConfigCategoryId;
  label: string;
  subLabel: string;
};

const CATEGORIES: ConfigCategory[] = [
  { id: "clients", label: "顧客マスタ", subLabel: "CLIENTS" },
  { id: "stakeholders", label: "担当マスタ", subLabel: "STAKEHOLDERS" },
  { id: "roles", label: "権限ロール", subLabel: "ROLES" },
  { id: "documents", label: "書類カテゴリ", subLabel: "DOCS" },
  { id: "integrations", label: "外部連携", subLabel: "INTEGRATIONS" },
  { id: "audit", label: "操作履歴", subLabel: "AUDIT" },
];

const stakeholderKindLabel: Record<StakeholderKind, string> = {
  staff: "スタッフ",
  supervisor: "上司",
  representative_tax_accountant: "代表税理士",
  client: "クライアント",
  bank: "銀行",
  third_party: "第三者",
  tax_office: "税務署",
};

const relationTypeOptions: ClientRelationType[] = ["group_company", "shareholder", "relative_group"];

export default function SettingsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ConfigCategoryId>("clients");
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [notificationEmailEnabled, setNotificationEmailEnabled] = useState(true);
  const [ocrAutoExtractEnabled, setOcrAutoExtractEnabled] = useState(true);
  const [alertConsumptionTaxMonthsBeforeDue, setAlertConsumptionTaxMonthsBeforeDue] = useState(2);
  const [alertCorporateTaxMonthsBeforeDue, setAlertCorporateTaxMonthsBeforeDue] = useState(2);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<string>("");
  const [isSavingClientMaster, setIsSavingClientMaster] = useState(false);
  const [clientMasterMessage, setClientMasterMessage] = useState("");
  const [editableClients, setEditableClients] = useState(CLIENTS);
  const [editableGroups, setEditableGroups] = useState(CLIENT_FAMILY_GROUPS);

  const systemConfigEndpoint = `${API_BASE}/system-config`;
  const clientMasterEndpoint = `${API_BASE}/client-master`;
  const auditEventsEndpoint = `${API_BASE}/audit-events`;

  type AuditEventRow = {
    id: number;
    created_at: string;
    stakeholder_id?: string | null;
    user_email?: string | null;
    role?: string | null;
    client_id?: string | null;
    path: string;
    action: string;
    result: string;
    detail?: string | null;
    http_status?: number | null;
  };

  const [auditRows, setAuditRows] = useState<AuditEventRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [auditResultFilter, setAuditResultFilter] = useState<"" | "success" | "denied">("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditPathFilter, setAuditPathFilter] = useState("");

  const summary = useMemo(
    () => ({
      clients: CLIENTS.length,
      groups: CLIENT_FAMILY_GROUPS.length,
      stakeholders: STAKEHOLDER_MASTER.length,
      roles: APP_ROLES.length,
      documents: DOCUMENT_CATEGORIES.length,
    }),
    []
  );

  useEffect(() => {
    let active = true;
    const loadSystemConfig = async () => {
      setIsLoadingConfig(true);
      setConfigMessage("");
      try {
        const res = await fetch(systemConfigEndpoint, { headers: buildAuthHeaders() });
        if (!res.ok) throw new Error("config-load-failed");
        const data = (await res.json()) as {
          google_drive_connected?: boolean;
          notification_email_enabled?: boolean;
          ocr_auto_extract_enabled?: boolean;
          alert_consumption_tax_months_before_due?: number;
          alert_corporate_tax_months_before_due?: number;
        };
        if (active) {
          setIsDriveConnected(!!data.google_drive_connected);
          setNotificationEmailEnabled(data.notification_email_enabled ?? true);
          setOcrAutoExtractEnabled(data.ocr_auto_extract_enabled ?? true);
          setAlertConsumptionTaxMonthsBeforeDue(data.alert_consumption_tax_months_before_due ?? 2);
          setAlertCorporateTaxMonthsBeforeDue(data.alert_corporate_tax_months_before_due ?? 2);
        }
      } catch {
        if (active) {
          setConfigMessage("設定の読込に失敗しました。権限を確認してください。");
        }
      } finally {
        if (active) setIsLoadingConfig(false);
      }
    };
    void loadSystemConfig();
    return () => {
      active = false;
    };
  }, [systemConfigEndpoint]);

  useEffect(() => {
    let active = true;
    const loadClientMaster = async () => {
      try {
        const res = await fetch(clientMasterEndpoint, { headers: buildAuthHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as {
          clients?: typeof CLIENTS;
          groups?: typeof CLIENT_FAMILY_GROUPS;
        };
        if (!active) return;
        if (Array.isArray(data.clients)) setEditableClients(data.clients);
        if (Array.isArray(data.groups)) setEditableGroups(data.groups);
      } catch {
        // Keep fallback values.
      }
    };
    void loadClientMaster();
    return () => {
      active = false;
    };
  }, [clientMasterEndpoint]);

  const handleSaveIntegrationConfig = async () => {
    setIsSavingConfig(true);
    setConfigMessage("");
    try {
      const res = await fetch(systemConfigEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({
          google_drive_connected: isDriveConnected,
          notification_email_enabled: notificationEmailEnabled,
          ocr_auto_extract_enabled: ocrAutoExtractEnabled,
          alert_consumption_tax_months_before_due: alertConsumptionTaxMonthsBeforeDue,
          alert_corporate_tax_months_before_due: alertCorporateTaxMonthsBeforeDue,
        }),
      });
      if (!res.ok) throw new Error("config-save-failed");
      setConfigMessage("保存しました。");
    } catch {
      setConfigMessage("保存に失敗しました。設定権限を確認してください。");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const loadAuditEvents = async () => {
    setAuditLoading(true);
    setAuditMessage("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "80");
      params.set("offset", "0");
      if (auditResultFilter) params.set("result", auditResultFilter);
      if (auditActionFilter.trim()) params.set("action", auditActionFilter.trim());
      if (auditPathFilter.trim()) params.set("path_contains", auditPathFilter.trim());
      const res = await fetch(`${auditEventsEndpoint}?${params.toString()}`, { headers: buildAuthHeaders() });
      if (!res.ok) throw new Error("audit-load-failed");
      const data = (await res.json()) as AuditEventRow[];
      setAuditRows(Array.isArray(data) ? data : []);
    } catch {
      setAuditMessage("監査ログの取得に失敗しました。管理者権限を確認してください。");
      setAuditRows([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeCategory !== "audit") return;
    void loadAuditEvents();
    // Intentionally only when switching to the audit tab; use 再読込 for filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleSaveClientMaster = async () => {
    setIsSavingClientMaster(true);
    setClientMasterMessage("");
    try {
      const res = await fetch(clientMasterEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({
          clients: editableClients,
          groups: editableGroups,
        }),
      });
      if (!res.ok) throw new Error("save-client-master-failed");
      setClientMasterMessage("顧客マスタを保存しました。");
    } catch {
      setClientMasterMessage("顧客マスタ保存に失敗しました。");
    } finally {
      setIsSavingClientMaster(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-600">
      <aside className="relative z-20 flex h-screen w-28 flex-shrink-0 flex-col border-r border-slate-700 bg-slate-900 shadow-2xl">
        <button
          onClick={() => router.push("/")}
          className="mx-auto mt-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-white"
        >
          ←
        </button>
        <div className="mt-6 text-center text-[10px] font-black tracking-widest text-blue-400">CONFIG</div>
        <div className="v-drum-scroller no-scrollbar mt-4 flex-1 px-2 py-6">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`v-item mb-4 w-full rounded-xl border px-2 py-3 text-center ${
                activeCategory === category.id
                  ? "active border-blue-500 bg-blue-600/20"
                  : "border-white/10 bg-slate-800 text-slate-300"
              }`}
            >
              <div className="text-xs font-bold">{category.label}</div>
              <div className="text-[9px] font-semibold opacity-70">{category.subLabel}</div>
            </button>
          ))}
        </div>
        <div className="mask-v-top pointer-events-none absolute left-0 top-0 z-20 h-20 w-full"></div>
        <div className="mask-v-bottom pointer-events-none absolute bottom-0 left-0 z-20 h-20 w-full"></div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-black text-slate-800">コンフィグまとめ</h1>
            <p className="text-xs text-slate-500">ドラム切替で設定領域を横断できます</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <span className="rounded-full bg-blue-50 px-3 py-1">顧客 {summary.clients}</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1">関係グループ {summary.groups}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1">担当 {summary.stakeholders}</span>
          </div>
        </header>

        <div className="p-8">
          {activeCategory === "clients" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">顧客マスタ / 関係グループ</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {editableClients.map((client, index) => {
                  const groups = editableGroups.filter((group) => group.clientIds.includes(client.id));
                  return (
                    <article key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1 text-sm font-bold text-slate-800"
                        value={client.name}
                        onChange={(e) =>
                          setEditableClients((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                          )
                        }
                      />
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        決算月:
                        <input
                          type="number"
                          min={1}
                          max={12}
                          className="w-16 rounded border border-slate-200 px-2 py-1"
                          value={client.fiscalMonth}
                          onChange={(e) =>
                            setEditableClients((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, fiscalMonth: Number(e.target.value) || item.fiscalMonth } : item
                              )
                            )
                          }
                        />
                        月
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {groups.length === 0 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">関係グループなし</span>
                        ) : (
                          groups.map((group) => (
                            <span key={group.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              {group.name}
                            </span>
                          ))
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">関係グループ編集</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEditableGroups((prev) => [
                        ...prev,
                        {
                          id: `g${Date.now()}`,
                          name: "新規グループ",
                          relationType: "group_company",
                          clientIds: [],
                          note: "",
                        },
                      ])
                    }
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    グループ追加
                  </button>
                </div>
                <div className="space-y-2">
                  {editableGroups.map((group, groupIndex) => (
                    <div key={group.id} className="rounded border border-slate-200 p-3">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                          className="rounded border border-slate-200 px-2 py-1 text-xs"
                          value={group.name}
                          onChange={(e) =>
                            setEditableGroups((prev) =>
                              prev.map((item, idx) => (idx === groupIndex ? { ...item, name: e.target.value } : item))
                            )
                          }
                        />
                        <select
                          className="rounded border border-slate-200 px-2 py-1 text-xs"
                          value={group.relationType}
                          onChange={(e) =>
                            setEditableGroups((prev) =>
                              prev.map((item, idx) =>
                                idx === groupIndex ? { ...item, relationType: e.target.value as ClientRelationType } : item
                              )
                            )
                          }
                        >
                          {relationTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {RELATION_TYPE_LABEL[option]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditableGroups((prev) => prev.filter((_, idx) => idx !== groupIndex))}
                          className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                        >
                          削除
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">構成クライアント</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {editableClients.map((client) => {
                          const selected = group.clientIds.includes(client.id);
                          return (
                            <button
                              key={`${group.id}-${client.id}`}
                              type="button"
                              onClick={() =>
                                setEditableGroups((prev) =>
                                  prev.map((item, idx) =>
                                    idx !== groupIndex
                                      ? item
                                      : {
                                          ...item,
                                          clientIds: selected
                                            ? item.clientIds.filter((id) => id !== client.id)
                                            : [...item.clientIds, client.id],
                                        }
                                  )
                                )
                              }
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                selected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {client.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveClientMaster}
                  disabled={isSavingClientMaster}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingClientMaster ? "保存中..." : "顧客マスタを保存"}
                </button>
                {clientMasterMessage && <span className="text-xs text-slate-500">{clientMasterMessage}</span>}
              </div>
            </section>
          )}

          {activeCategory === "stakeholders" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">担当マスタ</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {STAKEHOLDER_MASTER.map((actor) => (
                  <article key={actor.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-800">{actor.displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">{stakeholderKindLabel[actor.kind]} / role: {actor.appRoleId}</div>
                    <div className="mt-2 text-[11px] text-slate-500">scope: {actor.scopedClientIds.join(", ") || "-"}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeCategory === "roles" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">権限ロール</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {APP_ROLES.map((role) => (
                  <article key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-800">{role.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{role.description}</div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <span key={perm} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeCategory === "documents" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">書類カテゴリ</h2>
              <article className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800">OCR自動抽出</div>
                    <p className="mt-1 text-xs text-slate-500">アップロード後に顧客属性を自動抽出する設定</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOcrAutoExtractEnabled((prev) => !prev)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      ocrAutoExtractEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {ocrAutoExtractEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </article>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {DOCUMENT_CATEGORIES.map((doc) => (
                  <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-800">{doc.label}</div>
                    <div className="mt-2 flex gap-1 text-[10px]">
                      <span className={`rounded-full px-2 py-0.5 ${doc.ocrTarget ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>OCR</span>
                      <span className={`rounded-full px-2 py-0.5 ${doc.dashboardTarget ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>Dashboard</span>
                      <span className={`rounded-full px-2 py-0.5 ${doc.alertTarget ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>Alert</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeCategory === "audit" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">操作履歴（監査ログ）</h2>
              <p className="text-xs text-slate-500">
                API 上の成功操作と、401/403 による拒否を記録します。管理者（settings.manage）のみ参照できます。
              </p>
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="text-xs font-bold text-slate-600">
                  結果
                  <select
                    className="mt-1 block rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditResultFilter}
                    onChange={(e) => setAuditResultFilter(e.target.value as "" | "success" | "denied")}
                  >
                    <option value="">すべて</option>
                    <option value="success">success</option>
                    <option value="denied">denied</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-600">
                  アクション含む
                  <input
                    className="mt-1 block w-40 rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    placeholder="例: pdf.highlight"
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  パス含む
                  <input
                    className="mt-1 block w-48 rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditPathFilter}
                    onChange={(e) => setAuditPathFilter(e.target.value)}
                    placeholder="例: /api/"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void loadAuditEvents()}
                  disabled={auditLoading}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {auditLoading ? "読込中..." : "再読込"}
                </button>
              </div>
              {auditMessage && <p className="text-xs text-amber-700">{auditMessage}</p>}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-[11px] text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">時刻</th>
                      <th className="px-3 py-2">結果</th>
                      <th className="px-3 py-2">HTTP</th>
                      <th className="px-3 py-2">ロール</th>
                      <th className="px-3 py-2">顧客</th>
                      <th className="px-3 py-2">アクション</th>
                      <th className="px-3 py-2">パス</th>
                      <th className="px-3 py-2">詳細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.length === 0 && !auditLoading ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                          ログがありません
                        </td>
                      </tr>
                    ) : (
                      auditRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-600">{row.created_at}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 font-bold ${
                                row.result === "denied" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {row.result}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                            {row.http_status ?? "—"}
                          </td>
                          <td className="px-3 py-2">{row.role ?? "—"}</td>
                          <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]">{row.client_id ?? "—"}</td>
                          <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[10px]">{row.action}</td>
                          <td className="max-w-[180px] truncate px-3 py-2 font-mono text-[10px] text-slate-600">{row.path}</td>
                          <td className="max-w-xs truncate px-3 py-2 text-slate-500" title={row.detail ?? ""}>
                            {row.detail ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeCategory === "integrations" && (
            <section className="fade-in-up space-y-4">
              <h2 className="text-lg font-bold text-slate-800">外部連携</h2>
              <article className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Google Drive 連携</div>
                    <p className="mt-1 text-xs text-slate-500">[クライアントID]_[年度]_[書類名].pdf ルールで同期</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsDriveConnected((prev) => !prev)}
                      disabled={isLoadingConfig || isSavingConfig}
                      className={`rounded-lg px-4 py-2 text-xs font-bold ${
                        isDriveConnected
                          ? "border border-red-200 bg-white text-red-500 hover:bg-red-50"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {isDriveConnected ? "連携解除" : "連携する"}
                    </button>
                    <button
                      onClick={handleSaveIntegrationConfig}
                      disabled={isLoadingConfig || isSavingConfig}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isSavingConfig ? "保存中..." : "設定保存"}
                    </button>
                  </div>
                </div>
                {configMessage && <p className="mt-3 text-xs text-slate-500">{configMessage}</p>}
              </article>
              <article className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold text-slate-800">通知・アラート設定</div>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center justify-between text-xs text-slate-600">
                    <span>メール通知を有効化</span>
                    <input
                      type="checkbox"
                      checked={notificationEmailEnabled}
                      onChange={(e) => setNotificationEmailEnabled(e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-slate-600">
                    <span>消費税届出アラート（月前）</span>
                    <input
                      type="number"
                      min={0}
                      value={alertConsumptionTaxMonthsBeforeDue}
                      onChange={(e) => setAlertConsumptionTaxMonthsBeforeDue(Number(e.target.value) || 0)}
                      className="w-20 rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-slate-600">
                    <span>法人税届出アラート（月前）</span>
                    <input
                      type="number"
                      min={0}
                      value={alertCorporateTaxMonthsBeforeDue}
                      onChange={(e) => setAlertCorporateTaxMonthsBeforeDue(Number(e.target.value) || 0)}
                      className="w-20 rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                </div>
              </article>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}