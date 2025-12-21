"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-600">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => router.push('/')}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-xl font-bold"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-800">システム設定</h1>
      </header>

      <div className="max-w-3xl mx-auto p-8 space-y-8">
        
        {/* Google Drive Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Google Drive 連携
                {isDriveConnected ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">接続済み</span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">未接続</span>
                )}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                連携すると、指定したフォルダ内のPDFを自動的にDocuGridに同期します。<br/>
                ファイル名のルール: <code>[クライアントID]_[年度]_[書類名].pdf</code>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
              📂
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">
              {isDriveConnected ? 'connected_account@tax.co.jp' : 'Googleアカウントを連携'}
            </div>
            <button
              onClick={() => setIsDriveConnected(!isDriveConnected)}
              className={`
                px-6 py-2 rounded-lg font-bold text-sm transition-all
                ${isDriveConnected 
                  ? 'bg-white border-2 border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'}
              `}
            >
              {isDriveConnected ? '連携を解除' : '連携する'}
            </button>
          </div>
        </section>

        {/* Other Settings (Mock) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 opacity-60 pointer-events-none grayscale">
          <h2 className="text-lg font-bold text-slate-800 mb-4">通知設定 (Coming Soon)</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>未提出アラート（メール）</span>
              <div className="w-12 h-6 bg-slate-200 rounded-full relative"><div className="w-6 h-6 bg-white rounded-full shadow border border-slate-300"></div></div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}