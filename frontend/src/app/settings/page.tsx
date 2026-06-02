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
import { downloadReviewEventsExport, listReviewTimeline, type ReviewTimelineItem } from "@/features/pdf-viewer/lib/review-events";

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
  const [aiOpenaiEnabled, setAiOpenaiEnabled] = useState(false);
  const [aiOpenaiModel, setAiOpenaiModel] = useState("gpt-4o-mini");
  const [aiOpenaiKeyConfigured, setAiOpenaiKeyConfigured] = useState(false);
  const [aiOpenaiApiKey, setAiOpenaiApiKey] = useState("");
  const [aiGeminiEnabled, setAiGeminiEnabled] = useState(false);
  const [aiGeminiModel, setAiGeminiModel] = useState("gemini-2.0-flash");
  const [aiGeminiKeyConfigured, setAiGeminiKeyConfigured] = useState(false);
  const [aiGeminiApiKey, setAiGeminiApiKey] = useState("");
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
  const [auditClientFilter, setAuditClientFilter] = useState("");
  const [auditStakeholderFilter, setAuditStakeholderFilter] = useState("");
  const [auditFromDate, setAuditFromDate] = useState("");
  const [auditToDate, setAuditToDate] = useState("");
  const [reviewExportClientId, setReviewExportClientId] = useState("");
  const [reviewExportPeriodKey, setReviewExportPeriodKey] = useState("");
  const [reviewExportMessage, setReviewExportMessage] = useState("");
  const [reviewExportLoading, setReviewExportLoading] = useState(false);
  const [reviewTimelineRows, setReviewTimelineRows] = useState<ReviewTimelineItem[]>([]);
  const [reviewTimelineLoading, setReviewTimelineLoading] = useState(false);
  const [reviewTimelineMessage, setReviewTimelineMessage] = useState("");

  const REVIEW_EVENT_LABEL: Record<string, string> = {
    upload: "アップロード",
    work_save: "作業保存",
    audit_start: "監査開始",
    approve: "承認",
    remand: "差戻し",
    page_view: "ページ閲覧",
    annotate: "注釈",
    export_pdf: "PDF出力",
    viewer_open_preview: "プレビュー",
    viewer_open_edit: "編集開始",
    viewer_close: "ビューア終了",
    audit_link_create: "監査リンク",
  };

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
          ai_openai_enabled?: boolean;
          ai_openai_model?: string;
          ai_openai_key_configured?: boolean;
          ai_gemini_enabled?: boolean;
          ai_gemini_model?: string;
          ai_gemini_key_configured?: boolean;
        };
        if (active) {
          setIsDriveConnected(!!data.google_drive_connected);
          setNotificationEmailEnabled(data.notification_email_enabled ?? true);
          setOcrAutoExtractEnabled(data.ocr_auto_extract_enabled ?? true);
          setAlertConsumptionTaxMonthsBeforeDue(data.alert_consumption_tax_months_before_due ?? 2);
          setAlertCorporateTaxMonthsBeforeDue(data.alert_corporate_tax_months_before_due ?? 2);
          setAiOpenaiEnabled(!!data.ai_openai_enabled);
          setAiOpenaiModel(data.ai_openai_model ?? "gpt-4o-mini");
          setAiOpenaiKeyConfigured(!!data.ai_openai_key_configured);
          setAiGeminiEnabled(!!data.ai_gemini_enabled);
          setAiGeminiModel(data.ai_gemini_model ?? "gemini-2.0-flash");
          setAiGeminiKeyConfigured(!!data.ai_gemini_key_configured);
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
          ai_openai_enabled: aiOpenaiEnabled,
          ai_openai_model: aiOpenaiModel,
          ai_gemini_enabled: aiGeminiEnabled,
          ai_gemini_model: aiGeminiModel,
          ...(aiOpenaiApiKey.trim() ? { ai_openai_api_key: aiOpenaiApiKey.trim() } : {}),
          ...(aiGeminiApiKey.trim() ? { ai_gemini_api_key: aiGeminiApiKey.trim() } : {}),
        }),
      });
      if (!res.ok) throw new Error("config-save-failed");
      const saved = (await res.json()) as {
        ai_openai_key_configured?: boolean;
        ai_gemini_key_configured?: boolean;
      };
      setAiOpenaiKeyConfigured(!!saved.ai_openai_key_configured);
      setAiGeminiKeyConfigured(!!saved.ai_gemini_key_configured);
      setAiOpenaiApiKey("");
      setAiGeminiApiKey("");
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
      params.set("limit", "300");
      params.set("offset", "0");
      if (auditResultFilter) params.set("result", auditResultFilter);
      if (auditActionFilter.trim()) params.set("action", auditActionFilter.trim());
      if (auditPathFilter.trim()) params.set("path_contains", auditPathFilter.trim());
      if (auditClientFilter) params.set("client_id", auditClientFilter);
      if (auditStakeholderFilter) params.set("stakeholder_id", auditStakeholderFilter);
      if (auditFromDate) params.set("from_ts", `${auditFromDate}T00:00:00`);
      if (auditToDate) params.set("to_ts", `${auditToDate}T23:59:59`);
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

  const handleDownloadAuditCsv = () => {
    if (auditRows.length === 0) {
      setAuditMessage("CSV出力できるログがありません。");
      return;
    }
    const escapeCsv = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const text = String(value);
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replaceAll("\"", "\"\"")}"`;
      }
      return text;
    };
    const header = [
      "id",
      "created_at",
      "result",
      "http_status",
      "role",
      "stakeholder_id",
      "user_email",
      "client_id",
      "action",
      "path",
      "detail",
    ];
    const lines = [
      header.join(","),
      ...auditRows.map((row) =>
        [
          row.id,
          row.created_at,
          row.result,
          row.http_status ?? "",
          row.role ?? "",
          row.stakeholder_id ?? "",
          row.user_email ?? "",
          row.client_id ?? "",
          row.action,
          row.path,
          row.detail ?? "",
        ]
          .map((item) => escapeCsv(item))
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-events-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReviewExport = async (format: "csv" | "json") => {
    if (!reviewExportClientId) {
      setReviewExportMessage("顧客を選択してください。");
      return;
    }
    setReviewExportLoading(true);
    setReviewExportMessage("");
    try {
      await downloadReviewEventsExport({
        clientId: reviewExportClientId,
        periodKey: reviewExportPeriodKey.trim() || undefined,
        format,
      });
      setReviewExportMessage(`${format.toUpperCase()} をダウンロードしました。`);
    } catch {
      setReviewExportMessage("業務監査ログの出力に失敗しました（承認権限が必要です）。");
    } finally {
      setReviewExportLoading(false);
    }
  };

  const loadReviewTimeline = async () => {
    if (!reviewExportClientId) {
      setReviewTimelineMessage("顧客を選択してください。");
      return;
    }
    setReviewTimelineLoading(true);
    setReviewTimelineMessage("");
    try {
      const rows = await listReviewTimeline({
        clientId: reviewExportClientId,
        periodKey: reviewExportPeriodKey.trim() || undefined,
        limit: 80,
      });
      setReviewTimelineRows(rows);
      setReviewTimelineMessage(rows.length === 0 ? "該当する業務イベントがありません。" : `${rows.length} 件を表示しています。`);
    } catch {
      setReviewTimelineMessage("タイムラインの読込に失敗しました（document.view 権限が必要です）。");
      setReviewTimelineRows([]);
    } finally {
      setReviewTimelineLoading(false);
    }
  };

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
              <article className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm">
                <div className="text-sm font-bold text-slate-800">業務監査ログ（review_events）エクスポート</div>
                <p className="mt-1 text-xs text-slate-500">
                  チェック開始・承認・ページ閲覧など、資料単位の業務イベントを CSV / JSON で出力します（承認権限が必要）。
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-xs font-bold text-slate-600">
                    顧客
                    <select
                      className="mt-1 block w-48 rounded border border-slate-200 px-2 py-1 text-xs"
                      value={reviewExportClientId}
                      onChange={(e) => setReviewExportClientId(e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {editableClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.id} / {client.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    期キー（任意）
                    <input
                      className="mt-1 block w-40 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                      value={reviewExportPeriodKey}
                      onChange={(e) => setReviewExportPeriodKey(e.target.value)}
                      placeholder="year:1"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={reviewExportLoading}
                    onClick={() => void handleReviewExport("csv")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    disabled={reviewExportLoading}
                    onClick={() => void handleReviewExport("json")}
                    className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    JSON
                  </button>
                </div>
                {reviewExportMessage && <p className="mt-2 text-xs text-slate-600">{reviewExportMessage}</p>}
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-bold text-slate-800">業務監査タイムライン（閲覧）</div>
                <p className="mt-1 text-xs text-slate-500">
                  上と同じ顧客・期キーで、チェック・注釈・承認などのイベントを新しい順に表示します。
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={reviewTimelineLoading}
                    onClick={() => void loadReviewTimeline()}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {reviewTimelineLoading ? "読込中…" : "タイムライン読込"}
                  </button>
                  {reviewTimelineMessage && (
                    <span className="text-xs text-slate-600">{reviewTimelineMessage}</span>
                  )}
                </div>
                {reviewTimelineRows.length > 0 && (
                  <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">日時</th>
                          <th className="px-3 py-2">資料</th>
                          <th className="px-3 py-2">イベント</th>
                          <th className="px-3 py-2">版</th>
                          <th className="px-3 py-2">操作者</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewTimelineRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-500">
                              {new Date(row.created_at).toLocaleString("ja-JP")}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {row.slot_label ?? `slot ${row.slot_id}`}
                              <span className="ml-1 font-mono text-[10px] text-slate-400">{row.period_key}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {row.action_title ?? REVIEW_EVENT_LABEL[row.event_type] ?? row.event_type}
                            </td>
                            <td className="px-3 py-2 font-mono text-[10px] text-blue-700">
                              {row.version_label ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-[10px] text-slate-500">
                              {row.actor_email ?? row.actor_role ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
              <p className="text-xs text-slate-500">
                API 上の成功操作と、401/403 による拒否を記録します。管理者（settings.manage）のみ参照できます。
              </p>
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="text-xs font-bold text-slate-600">
                  期間（開始）
                  <input
                    type="date"
                    className="mt-1 block rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditFromDate}
                    onChange={(e) => setAuditFromDate(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  期間（終了）
                  <input
                    type="date"
                    className="mt-1 block rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditToDate}
                    onChange={(e) => setAuditToDate(e.target.value)}
                  />
                </label>
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
                  顧客
                  <select
                    className="mt-1 block w-36 rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditClientFilter}
                    onChange={(e) => setAuditClientFilter(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {editableClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.id} / {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-600">
                  担当
                  <select
                    className="mt-1 block w-44 rounded border border-slate-200 px-2 py-1 text-xs"
                    value={auditStakeholderFilter}
                    onChange={(e) => setAuditStakeholderFilter(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {STAKEHOLDER_MASTER.map((actor) => (
                      <option key={actor.id} value={actor.id}>
                        {actor.id} / {actor.displayName}
                      </option>
                    ))}
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
                <button
                  type="button"
                  onClick={handleDownloadAuditCsv}
                  disabled={auditRows.length === 0}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  CSV出力
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
                <div className="text-sm font-bold text-slate-800">AI / OCR 分類（システム管理者）</div>
                <p className="mt-1 text-xs text-slate-500">
                  API キーはサーバーにのみ保存され、画面には表示されません。ルール分類の確信度が低い場合に OpenAI で補助します。
                </p>
                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between text-xs text-slate-600">
                    <span>OCR 自動抽出を有効化</span>
                    <input
                      type="checkbox"
                      checked={ocrAutoExtractEnabled}
                      onChange={(e) => setOcrAutoExtractEnabled(e.target.checked)}
                    />
                  </label>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>OpenAI 補助分類</span>
                      <input
                        type="checkbox"
                        checked={aiOpenaiEnabled}
                        onChange={(e) => setAiOpenaiEnabled(e.target.checked)}
                      />
                    </label>
                    <label className="mt-2 block text-xs text-slate-600">
                      モデル
                      <input
                        className="mt-1 block w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                        value={aiOpenaiModel}
                        onChange={(e) => setAiOpenaiModel(e.target.value)}
                      />
                    </label>
                    <label className="mt-2 block text-xs text-slate-600">
                      API キー
                      <input
                        type="password"
                        autoComplete="off"
                        className="mt-1 block w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                        value={aiOpenaiApiKey}
                        onChange={(e) => setAiOpenaiApiKey(e.target.value)}
                        placeholder={aiOpenaiKeyConfigured ? "設定済み（変更時のみ入力）" : "sk-..."}
                      />
                    </label>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Gemini 補助分類</span>
                      <input
                        type="checkbox"
                        checked={aiGeminiEnabled}
                        onChange={(e) => setAiGeminiEnabled(e.target.checked)}
                      />
                    </label>
                    <p className="mt-1 text-[10px] text-slate-500">
                      OpenAI より確信度が低い場合のフォールバックとして利用します。
                    </p>
                    <label className="mt-2 block text-xs text-slate-600">
                      モデル
                      <input
                        className="mt-1 block w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                        value={aiGeminiModel}
                        onChange={(e) => setAiGeminiModel(e.target.value)}
                      />
                    </label>
                    <label className="mt-2 block text-xs text-slate-600">
                      API キー
                      <input
                        type="password"
                        autoComplete="off"
                        className="mt-1 block w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                        value={aiGeminiApiKey}
                        onChange={(e) => setAiGeminiApiKey(e.target.value)}
                        placeholder={aiGeminiKeyConfigured ? "設定済み（変更時のみ入力）" : "AIza..."}
                      />
                    </label>
                  </div>
                </div>
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