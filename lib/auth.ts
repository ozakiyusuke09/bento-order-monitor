"use client";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";

const MOCK_AUTH_KEY = "bento-order-monitor.mock-auth";

export async function isLoggedIn() {
  if (hasSupabaseEnv && supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        await supabase.auth.signOut();
        return false;
      }
      return Boolean(data.session);
    } catch (caught) {
      console.warn("Failed to read Supabase session", caught);
      await supabase.auth.signOut();
      return false;
    }
  }
  return typeof window !== "undefined" && window.localStorage.getItem(MOCK_AUTH_KEY) === "true";
}

export async function login(email: string, password: string) {
  if (hasSupabaseEnv && supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return;
  }
  if (!email || !password) throw new Error("メールアドレスとパスワードを入力してください。");
  window.localStorage.setItem(MOCK_AUTH_KEY, "true");
}

export async function logout() {
  if (hasSupabaseEnv && supabase) {
    await supabase.auth.signOut();
    return;
  }
  window.localStorage.removeItem(MOCK_AUTH_KEY);
}
