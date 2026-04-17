"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAccessToken, saveCurrentUser } from '@/lib/auth';
import { STAKEHOLDER_MASTER } from '@/config/organization';
import { API_BASE } from '@/config/api';

export default function LoginPage() {
  const router = useRouter();
  const tempAdminEmail = "admin@tax.co.jp";
  const [email, setEmail] = useState("admin@tax.co.jp");
  const [password, setPassword] = useState("password");
  const defaultStakeholderId =
    STAKEHOLDER_MASTER.find((item) => item.appRoleId === "admin")?.id ?? STAKEHOLDER_MASTER[0]?.id ?? "";
  const [stakeholderId, setStakeholderId] = useState(defaultStakeholderId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const isTempAdmin = email.trim().toLowerCase() === tempAdminEmail;
    const effectiveStakeholderId = isTempAdmin ? "actor-admin" : stakeholderId;
    const selected = STAKEHOLDER_MASTER.find((item) => item.id === effectiveStakeholderId);
    const name = email.split("@")[0] || email;
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, stakeholder_id: effectiveStakeholderId }),
      });
      const data = (await res.json().catch(() => ({}))) as { access_token?: string; detail?: unknown };
      if (!res.ok || !data.access_token) {
        const msg = typeof data.detail === "string" ? data.detail : "ログインに失敗しました";
        setError(msg);
        return;
      }
      saveAccessToken(data.access_token);
      saveCurrentUser({
        email,
        name: selected?.displayName || name,
        stakeholderId: selected?.id,
        appRoleId: isTempAdmin ? "admin" : selected?.appRoleId,
      });
      router.push('/');
    } catch {
      setError("サーバーに接続できませんでした。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2">
            <span className="text-blue-500">Docu</span>Grid
          </h1>
          <p className="text-slate-400 text-sm">税務ドキュメント管理システム</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">メールアドレス</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-lg bg-slate-100 border-2 border-slate-200 focus:border-blue-500 focus:bg-white transition-colors outline-none font-bold text-slate-700"
              placeholder="tax@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">担当マスタ</label>
            <select
              className="w-full px-4 py-3 rounded-lg bg-slate-100 border-2 border-slate-200 focus:border-blue-500 focus:bg-white transition-colors outline-none font-bold text-slate-700"
              value={stakeholderId}
              onChange={(e) => setStakeholderId(e.target.value)}
            >
              {STAKEHOLDER_MASTER.filter((item) => item.status === "active").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName} [{item.kind}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">パスワード</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg bg-slate-100 border-2 border-slate-200 focus:border-blue-500 focus:bg-white transition-colors outline-none font-bold text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-center text-xs font-bold text-red-600">{error}</p>}

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60"
          >
            {submitting ? "ログイン中..." : "ログインして開始"}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            Authorized Personnel Only
          </p>
        </form>
      </div>
    </div>
  );
}