"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(pathname === "/login" || !hasSupabaseEnv);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setReady(true);
      return;
    }
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    isLoggedIn().then((loggedIn) => {
      if (!loggedIn) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      setReady(true);
    });
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-slate-700">
        読み込み中...
      </div>
    );
  }

  return <>{children}</>;
}
