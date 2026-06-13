"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PersonaDefinition } from "@/config/personas";
import type { ScreenDesignPersona } from "@/config/screen-design-types";
import { PersonalScreenDesignForm } from "@/features/screen-design/PersonalScreenDesignForm";
import type { DocugridUser } from "@/lib/auth";
import { clearAuthSession } from "@/lib/auth";

type Props = {
  persona: PersonaDefinition;
  user: DocugridUser | null;
  design: ScreenDesignPersona | null;
  children: React.ReactNode;
};

export function PersonaWorkspaceLayout({ persona, user, design, children }: Props) {
  const router = useRouter();
  const accent = design?.accentColor || "#2563eb";
  const title = design?.pageTitle || persona.label;
  const welcome = design?.welcomeMessage || persona.description;

  return (
    <div className="min-h-screen bg-slate-100">
      <header
        className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm"
        style={{ borderTopWidth: 4, borderTopColor: accent }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Workspace</p>
            <h1 className="text-xl font-black text-slate-800">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{welcome}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {user?.firmLabel && (
              <div className="mb-1 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                {user.firmLabel}
              </div>
            )}
            <div>{user?.name || user?.email}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">{children}</main>

      <footer className="mx-auto max-w-4xl space-y-6 px-6 pb-8">
        <PersonalScreenDesignForm />

        {persona.navItems.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">ナビ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {persona.navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {persona.shell === "matrix" && (
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
            >
              資料マトリクスへ
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              router.push("/login");
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            ログアウト
          </button>
        </div>
      </footer>
    </div>
  );
}
