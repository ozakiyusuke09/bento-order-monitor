"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, Monitor, Plus } from "lucide-react";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/orders", label: "注文", icon: ClipboardList },
  { href: "/orders/new", label: "登録", icon: Plus },
  { href: "/monitor", label: "モニター", icon: Monitor },
  { href: "/admin", label: "管理", icon: LayoutDashboard }
];

export function AppShell({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={dark ? "min-h-screen bg-slate-950 text-white" : "min-h-screen bg-paper text-slate-950"}>
      <header
        className={
          dark
            ? "sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur"
            : "sticky top-0 z-20 border-b border-slate-200 bg-paper/90 backdrop-blur"
        }
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <Link href="/orders" className="mr-auto min-w-0">
            <div className="text-sm font-semibold text-slate-500">弁当屋</div>
            <div className={dark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-950"}>
              受注モニター
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                      : dark
                        ? "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                        : "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            aria-label="ログアウト"
            title="ログアウト"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className={
              dark
                ? "rounded-md border border-white/15 p-2 text-slate-200 hover:bg-white/10"
                : "rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            }
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "flex flex-col items-center gap-1 p-3 text-slate-950" : "flex flex-col items-center gap-1 p-3 text-slate-500"}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
