"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 本来はここで認証処理が入る
    router.push('/'); // メイン画面へ移動
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
              defaultValue="admin@tax.co.jp"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">パスワード</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg bg-slate-100 border-2 border-slate-200 focus:border-blue-500 focus:bg-white transition-colors outline-none font-bold text-slate-700"
              placeholder="••••••••"
              defaultValue="password"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
          >
            ログインして開始
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            Authorized Personnel Only
          </p>
        </form>
      </div>
    </div>
  );
}