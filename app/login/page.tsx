"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { login } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("staff@example.com");
  const [password, setPassword] = useState(hasSupabaseEnv ? "" : "password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next ?? "/orders");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-500">弁当屋 受注モニター</div>
          <h1 className="mt-1 text-3xl font-black text-slate-950">ログイン</h1>
          <p className="mt-2 text-sm text-slate-500">
            {hasSupabaseEnv
              ? "Supabaseで作成したスタッフのメールアドレスとパスワードを入力してください。"
              : "Supabase未設定時は表示中のダミー情報でログインできます。"}
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-900"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-slate-700">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-900"
          />
        </label>
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 font-bold text-white disabled:opacity-60"
        >
          <LogIn className="h-5 w-5" />
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
