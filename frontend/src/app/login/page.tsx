"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import {
  clearAuthSession,
  fetchMeWithToken,
  isSessionCookiePreferred,
  saveAccessToken,
  saveCurrentUser,
  setSessionCookiePreferred,
} from "@/lib/auth";
import { parseApiErrorBody } from "@/lib/parse-api-error";
import { STAKEHOLDER_MASTER, type AppPermission, type AppRoleId } from "@/config/organization";
import { API_BASE } from "@/config/api";
import type { PersonaId } from "@/config/personas";
import { getPostLoginPath } from "@/lib/persona";

type AuthConfig = {
  google_client_id: string;
  password_login_enabled: boolean;
  session_cookie?: boolean;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const sessionNotice =
    reason === "session"
      ? "セッションの有効期限が切れました。再度ログインしてください。"
      : reason === "offline"
        ? "サーバーに接続できません。バックエンド（ポート 8000）が起動しているか確認してください。"
        : "";

  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [configError, setConfigError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [email, setEmail] = useState("yamamoto@tax.co.jp");
  const [password, setPassword] = useState("password");

  useEffect(() => {
    clearAuthSession();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/config`);
        if (!res.ok) {
          setConfigError("認証設定を取得できませんでした");
          return;
        }
        const data = (await res.json()) as AuthConfig;
        setSessionCookiePreferred(data.session_cookie !== false);
        setAuthConfig(data);
      } catch {
        setConfigError("サーバーに接続できません。バックエンドが起動しているか確認してください。");
      }
    })();
  }, []);

  const completeLogin = useCallback(
    async (accessToken: string, fallbackEmail = "") => {
      if (!isSessionCookiePreferred() && accessToken) {
        saveAccessToken(accessToken);
      }
      const me = await fetchMeWithToken(accessToken);
      const loginEmail = me?.email || fallbackEmail;
      const matched = STAKEHOLDER_MASTER.find((item) => item.id === me?.stakeholder_id);
      const name = loginEmail.split("@")[0] || loginEmail;
      const savedUser = {
        email: loginEmail,
        name: matched?.displayName || name,
        stakeholderId: me?.stakeholder_id || matched?.id,
        appRoleId: (me?.role as AppRoleId) || matched?.appRoleId,
        firmId: me?.firm_id,
        firmLabel: me?.firm_label,
        visibleClientIds: Array.isArray(me?.visible_client_ids) ? me.visible_client_ids : undefined,
        permissions: Array.isArray(me?.permissions) ? (me.permissions as AppPermission[]) : undefined,
        personaId: me?.persona_id as PersonaId | undefined,
        personaLabel: me?.persona_label,
      };
      saveCurrentUser(savedUser);
      router.push(getPostLoginPath(savedUser));
    },
    [router],
  );

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setError("");
    setSubmitting(true);
    try {
      if (!credentialResponse.credential) {
        setError("Google 認証に失敗しました");
        return;
      }
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        access_token?: string;
        detail?: unknown;
      };
      if (!res.ok || !data.access_token) {
        setError(parseApiErrorBody(data, "Google ログインに失敗しました"));
        return;
      }
      await completeLogin(data.access_token);
    } catch {
      setError("Google ログイン中にエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, stakeholder_id: "" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        access_token?: string;
        detail?: unknown;
      };
      if (!res.ok || !data.access_token) {
        setError(parseApiErrorBody(data, "ログインに失敗しました"));
        return;
      }
      await completeLogin(data.access_token, email);
    } catch {
      setError("サーバーに接続できませんでした");
    } finally {
      setSubmitting(false);
    }
  };

  const googleClientId =
    authConfig?.google_client_id ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2">
            <span className="text-blue-500">Docu</span>Grid
          </h1>
          <p className="text-slate-400 text-sm">税務ドキュメント管理システム</p>
        </div>

        <div className="p-8 space-y-6">
          {(sessionNotice || configError) && (
            <p className="text-center text-xs font-bold text-amber-600">{sessionNotice || configError}</p>
          )}

          {googleClientId ? (
            <div className="flex flex-col items-center gap-3">
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google ログインがキャンセルされました")}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="320"
                />
              </GoogleOAuthProvider>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                事務所の Google アカウントでサインインしてください。
                <br />
                未登録のメールアドレスはアクセスできません。
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600">
              Google ログインが未設定です。
              <br />
              <code className="text-xs">GOOGLE_OAUTH_CLIENT_ID</code> を設定してください。
            </p>
          )}

          {authConfig?.password_login_enabled && (
            <div className="border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowDevLogin((v) => !v)}
                className="w-full text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                {showDevLogin ? "開発用ログインを閉じる" : "開発用パスワードログイン"}
              </button>
              {showDevLogin && (
                <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3">
                  <input
                    type="email"
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tax.co.jp"
                  />
                  <input
                    type="password"
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-60"
                  >
                    開発用ログイン
                  </button>
                </form>
              )}
            </div>
          )}

          {error && <p className="text-center text-xs font-bold text-red-600">{error}</p>}

          {submitting && (
            <p className="text-center text-xs text-slate-500">ログイン処理中…</p>
          )}

          <p className="text-center text-xs text-slate-400">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
          読み込み中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
