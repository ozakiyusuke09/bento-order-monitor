"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  CookingPot,
  PackageCheck,
  ShoppingBag,
  Truck,
  X
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { StatusBadge } from "@/components/status-badge";
import { displayDate, displayTime, todayString } from "@/lib/date";
import { receiveTypeLabels, statusLabels } from "@/lib/constants";
import { summarizeOrders, summarizeRemainingOrders } from "@/lib/order-store";
import { displayShortOrderNumber } from "@/lib/order-number";
import { useOrders } from "@/hooks/use-orders";
import type { OrderWithRelations } from "@/lib/types";

export default function MonitorPage() {
  const { orders } = useOrders();
  const stats = summarizeOrders(orders);
  const remainingStats = summarizeRemainingOrders(orders);
  const [now, setNow] = useState(new Date());
  const [flashId, setFlashId] = useState<string | null>(null);
  const seenOrderIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentIds = new Set(orders.map((order) => order.id));
    if (!seenOrderIdsRef.current) {
      seenOrderIdsRef.current = currentIds;
      return;
    }

    const addedOrder = orders.find((order) => !seenOrderIdsRef.current?.has(order.id));
    seenOrderIdsRef.current = currentIds;
    if (!addedOrder) return;

    setFlashId(addedOrder.id);
    const timer = window.setTimeout(() => setFlashId(null), 10000);
    return () => window.clearTimeout(timer);
  }, [orders]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "completed" && order.status !== "cancelled"),
    [orders]
  );
  const newestNewOrder =
    [...orders].filter((order) => order.status === "new").sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ??
    null;
  const featuredOrder = newestNewOrder ?? activeOrders[0] ?? orders[0];
  const upcomingOrders = activeOrders
    .filter((order) => order.pickup_date === todayString())
    .sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
    .slice(0, 4);
  const deliveryOrders = activeOrders
    .filter((order) => order.receive_type === "delivery")
    .sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
    .slice(0, 4);
  const heroMode = featuredOrder?.status === "new" ? "new" : "active";

  return (
    <AuthGuard>
      <main className="h-screen overflow-hidden bg-[#06101a] p-3 text-white">
        <div className="mx-auto grid h-full min-w-[1280px] max-w-[1900px] grid-rows-[auto_132px_1fr] gap-3 rounded-xl border border-slate-700 bg-gradient-to-br from-[#07131f] via-[#091923] to-[#03070c] p-4 shadow-2xl">
          <header className="flex items-center justify-between gap-5 border-b border-white/10 pb-3">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2.5">
                <ShoppingBag className="h-8 w-8 text-slate-100" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-normal">本日の受注モニター</h1>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <nav className="flex items-center gap-2">
                <Link
                  href="/orders"
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-slate-100 hover:bg-white/15"
                >
                  注文一覧
                </Link>
                <Link
                  href="/orders/new"
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-sm font-black text-emerald-100 hover:bg-emerald-500/30"
                >
                  注文登録
                </Link>
              </nav>
              <div className="h-12 w-px bg-white/15" />
              <div className="flex items-baseline gap-4 whitespace-nowrap">
                <div className="text-5xl font-black leading-none text-slate-100">
                  {now.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })}
                </div>
                <div className="text-5xl font-black leading-none">{now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="h-12 w-px bg-white/15" />
              <div className="text-center">
                <div className="text-sm font-bold text-slate-400">本日の注文</div>
                <div className="text-3xl font-black">{orders.length}<span className="ml-1 text-lg">件</span></div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 grid-cols-[1fr_360px] gap-3">
            <section
              className={`min-h-0 rounded-xl border p-3 ${
                heroMode === "new"
                  ? "border-red-400 bg-red-500/10 shadow-[0_0_24px_rgba(248,113,113,0.22)]"
                  : featuredOrder
                    ? "border-sky-400/50 bg-sky-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {featuredOrder ? <NewOrderHero order={featuredOrder} flash={flashId === featuredOrder.id} mode={heroMode} /> : <EmptyHero />}
            </section>
            <ProductPanel stats={remainingStats} compact />
          </div>

          <div className="grid min-h-0 grid-cols-[1fr_360px] gap-3">
            <section className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2">
                  <MonitorStatusCard label="新規" count={stats.statusCounts.new} tone="red" icon={<ClipboardPlus />} />
                  <MonitorStatusCard label="確認済み" count={stats.statusCounts.confirmed} tone="amber" icon={<CheckCircle2 />} />
                  <MonitorStatusCard label="調理中" count={stats.statusCounts.cooking} tone="blue" icon={<CookingPot />} />
                  <MonitorStatusCard label="完了" count={stats.statusCounts.completed} tone="green" icon={<PackageCheck />} />
                  <MonitorStatusCard label="中止" count={stats.statusCounts.cancelled} tone="slate" icon={<X />} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MonitorStatusCard label="店頭受取" count={stats.pickupCount} tone="slate" icon={<ShoppingBag />} />
                  <MonitorStatusCard label="配達" count={stats.deliveryCount} tone="violet" icon={<Truck />} />
                </div>
              </div>

              <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="grid grid-cols-[90px_1.1fr_1.45fr_80px_100px_1fr] gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-slate-300">
                  <div>時間</div>
                  <div>注文者</div>
                  <div>商品</div>
                  <div>数量</div>
                  <div>受取</div>
                  <div>備考</div>
                </div>
                <div className="monitor-scroll h-full overflow-auto">
                  {orders.slice(0, 14).map((order) => (
                    <MonitorOrderRow key={order.id} order={order} flash={flashId === order.id} />
                  ))}
                </div>
              </section>
            </section>

            <aside className="grid min-h-0 grid-rows-[1fr_1fr] gap-3">
              <UpcomingPanel orders={upcomingOrders} now={now} />
              <DeliveryPanel orders={deliveryOrders} />
            </aside>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function NewOrderHero({ order, flash, mode }: { order: OrderWithRelations; flash: boolean; mode: "new" | "active" }) {
  const mainItem = order.items[0];
  const itemText = order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ");
  const isNew = mode === "new";
  const iconClass = isNew
    ? "bg-red-600 shadow-[0_0_24px_rgba(239,68,68,0.55)]"
    : "bg-sky-600 shadow-[0_0_24px_rgba(56,189,248,0.28)]";
  const badgeClass = isNew ? "bg-red-600" : "bg-sky-600";
  const dividerClass = isNew ? "border-red-300/30" : "border-sky-300/30";

  return (
    <div className={`grid h-full grid-cols-[92px_1fr] items-center gap-3 ${flash ? "animate-pulse" : ""}`}>
      <div className={`flex h-20 w-20 items-center justify-center rounded-full text-white ${iconClass}`}>
        {isNew ? <Bell className="h-11 w-11" /> : <Clock className="h-11 w-11" />}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <span className={`rounded-md px-2.5 py-1 text-sm font-black text-white ${badgeClass}`}>
            {isNew ? "NEW ORDER" : "ACTIVE ORDER"}
          </span>
          <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-sm font-black text-slate-100">
            {displayShortOrderNumber(order)}
          </span>
          <span className="truncate text-2xl font-black">{isNew ? "新着注文！" : "最新の未完了注文"}</span>
        </div>
        <div className={`grid grid-cols-[110px_1.15fr_1.4fr_82px_1fr] gap-4 border-t pt-2 ${dividerClass}`}>
          <HeroField label="受付時刻" value={displayTime(order.pickup_time)} large />
          <HeroField label="注文者" value={order.customer_name} />
          <HeroField label="商品・数量" value={mainItem ? itemText : "-"} />
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-300">受取</div>
            <span className={`mt-1 inline-flex rounded-md px-2 py-1 text-base font-black leading-none text-white ${badgeClass}`}>
              {receiveTypeLabels[order.receive_type]}
            </span>
          </div>
          <HeroField label="備考" value={order.note || order.delivery_address || "なし"} accent={Boolean(order.note || order.delivery_address)} />
        </div>
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="flex h-28 items-center justify-center text-2xl font-black text-slate-400">
      本日の注文はまだありません。
    </div>
  );
}

function HeroField({
  label,
  value,
  large = false,
  accent = false
}: {
  label: string;
  value: string;
  large?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-black text-slate-300">{label}</div>
      <div className={`mt-0.5 truncate font-black ${large ? "text-3xl" : "text-2xl"} ${accent ? "text-red-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function MonitorStatusCard({
  label,
  count,
  tone,
  icon
}: {
  label: string;
  count: number;
  tone: "red" | "amber" | "blue" | "green" | "violet" | "slate";
  icon: ReactNode;
}) {
  const tones = {
    red: "border-red-500/60 bg-red-600/20 text-red-100",
    amber: "border-amber-500/60 bg-amber-600/20 text-amber-100",
    blue: "border-blue-500/60 bg-blue-600/20 text-blue-100",
    green: "border-emerald-500/60 bg-emerald-600/20 text-emerald-100",
    violet: "border-violet-500/60 bg-violet-600/20 text-violet-100",
    slate: "border-slate-500/60 bg-slate-600/20 text-slate-100"
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${tones[tone]}`}>
      <div className="[&>svg]:h-8 [&>svg]:w-8">{icon}</div>
      <div>
        <div className="text-base font-black">{label}</div>
        <div className="text-3xl font-black">{count}<span className="ml-1 text-base">件</span></div>
      </div>
    </div>
  );
}

function MonitorOrderRow({ order, flash }: { order: OrderWithRelations; flash: boolean }) {
  const itemSummary = order.items.map((item) => item.product_name).join(" / ");
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isAlert = order.status === "new" || flash;

  return (
    <div
      className={`grid grid-cols-[90px_1.1fr_1.45fr_80px_100px_1fr] gap-2 border-b border-white/10 px-3 py-2 ${
        isAlert ? "bg-red-500/10" : ""
      }`}
    >
      <div>
        <div className="text-xs font-black text-slate-400">{displayShortOrderNumber(order)}</div>
        <div className={`text-xl font-black ${isAlert ? "text-red-300" : "text-slate-100"}`}>{displayTime(order.pickup_time)}</div>
      </div>
      <div className="truncate text-base font-black text-white">{order.customer_name}</div>
      <div className="truncate text-base font-bold text-slate-100">{itemSummary}</div>
      <div className="text-base font-black text-white">x {quantity}</div>
      <div className="text-base font-black text-slate-100">{receiveTypeLabels[order.receive_type]}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-base font-bold text-slate-300">{order.note || order.delivery_address || "-"}</div>
        <StatusBadge status={order.status} strong />
      </div>
    </div>
  );
}

function ProductPanel({ stats, compact = false }: { stats: ReturnType<typeof summarizeRemainingOrders>; compact?: boolean }) {
  return (
    <section className="min-h-0 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-end justify-between">
        <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>商品別合計</h2>
        <div className="text-base font-black text-slate-300">残り {stats.totalItems} 個</div>
      </div>
      <div className="space-y-1.5">
        {stats.productTotals.slice(0, compact ? 4 : 8).map((item) => (
          <div key={item.product_name} className="flex items-center justify-between border-t border-white/10 pt-1.5">
            <div className="truncate text-base font-bold text-slate-100">{item.product_name}</div>
            <div className="text-2xl font-black text-white">{item.quantity}<span className="ml-1 text-xs">個</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingPanel({ orders, now }: { orders: OrderWithRelations[]; now: Date }) {
  return (
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2">
        <h2 className="flex min-w-0 items-center truncate text-base font-black leading-tight">
          <span className="truncate">まもなく受け渡し</span>
        </h2>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <SideOrder key={order.id} order={order} sub={timeLeftText(order, now)} />
        ))}
        {orders.length === 0 ? <div className="text-slate-400">対象の注文はありません。</div> : null}
      </div>
    </section>
  );
}

function DeliveryPanel({ orders }: { orders: OrderWithRelations[] }) {
  return (
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2">
        <h2 className="flex min-w-0 items-center truncate text-base font-black leading-tight">
          <span className="truncate">配達予定</span>
        </h2>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <SideOrder key={order.id} order={order} sub={order.delivery_address || "住所未入力"} />
        ))}
        {orders.length === 0 ? <div className="text-slate-400">配達予定はありません。</div> : null}
      </div>
    </section>
  );
}

function SideOrder({ order, sub }: { order: OrderWithRelations; sub: string }) {
  const itemText = order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ");
  return (
    <div className="grid grid-cols-[62px_1fr_auto] gap-2 border-t border-white/10 pt-2">
      <div className="text-base font-black text-red-300">{displayTime(order.pickup_time)}</div>
      <div className="min-w-0">
        <div className="truncate text-base font-black text-white">{order.customer_name}</div>
        <div className="truncate text-sm font-bold text-slate-300">{itemText}</div>
        <div className="truncate text-xs font-bold text-red-300">{sub}</div>
      </div>
      <div className="self-center rounded-md bg-slate-700 px-2 py-1 text-xs font-black">{receiveTypeLabels[order.receive_type]}</div>
    </div>
  );
}

function timeLeftText(order: OrderWithRelations, now: Date) {
  const target = new Date(`${order.pickup_date}T${order.pickup_time}`);
  const minutes = Math.round((target.getTime() - now.getTime()) / 60000);
  if (minutes < 0) return `${Math.abs(minutes)}分超過`;
  if (minutes === 0) return "まもなく";
  return `あと${minutes}分`;
}
