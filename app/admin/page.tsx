"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { ProductTotals } from "@/components/product-totals";
import { SummaryStrip } from "@/components/summary-strip";
import { StatusBadge } from "@/components/status-badge";
import { displayTime } from "@/lib/date";
import { summarizeOrders } from "@/lib/order-store";
import { useOrders } from "@/hooks/use-orders";

export default function AdminPage() {
  const { orders } = useOrders();
  const stats = summarizeOrders(orders);
  const recent = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:pb-10">
          <div className="mb-5">
            <div className="text-sm font-bold text-slate-500">社内テスト用</div>
            <h1 className="text-3xl font-black text-slate-950">管理ダッシュボード</h1>
          </div>

          <SummaryStrip stats={stats} />
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="本日の注文数" value={`${orders.length}件`} />
                <Metric label="キャンセル数" value={`${stats.statusCounts.cancelled}件`} />
                <Metric label="添付あり注文" value={`${orders.filter((order) => order.attachments.length > 0).length}件`} />
              </div>
              <h2 className="mt-6 text-xl font-black text-slate-950">直近の注文</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {recent.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="font-black text-slate-950">{displayTime(order.pickup_time)} {order.customer_name}</div>
                      <div className="text-sm text-slate-500">
                        {order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ")}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            </section>
            <ProductTotals stats={stats} />
          </div>
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}
