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
      <main className="h-screen overflow-hidden bg-[#06101a] p-2 text-white lg:p-3">
        <div className="mx-auto grid h-full w-full max-w-[1900px] grid-rows-[auto_minmax(54px,7dvh)_minmax(0,1fr)] gap-2 rounded-xl border border-slate-700 bg-gradient-to-br from-[#07131f] via-[#091923] to-[#03070c] p-2 shadow-2xl lg:gap-3 lg:p-3">
          <header className="grid min-w-0 grid-cols-[minmax(240px,1fr)_auto] items-center gap-3 border-b border-white/10 pb-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2">
                <ShoppingBag className="h-[clamp(1.75rem,2.8vw,2.6rem)] w-[clamp(1.75rem,2.8vw,2.6rem)] text-slate-100" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[clamp(1.5rem,2.8vw,3rem)] font-black leading-tight tracking-normal">本日の受注モニター</h1>
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-end gap-[clamp(0.5rem,1.3vw,1.25rem)]">
              <nav className="flex shrink-0 items-center gap-2">
                <Link
                  href="/orders"
                  className="rounded-md border border-white/15 bg-white/10 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-slate-100 hover:bg-white/15"
                >
                  注文一覧
                </Link>
                <Link
                  href="/orders/new"
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-emerald-100 hover:bg-emerald-500/30"
                >
                  注文登録
                </Link>
              </nav>
              <div className="h-[clamp(2.2rem,4vw,4rem)] w-px bg-white/15" />
              <div className="flex min-w-0 items-baseline gap-[clamp(0.45rem,1vw,1rem)] whitespace-nowrap">
                <div className="text-[clamp(1.6rem,3.4vw,4.2rem)] font-black leading-none text-slate-100">
                  {now.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })}
                </div>
                <div className="text-[clamp(1.6rem,3.4vw,4.2rem)] font-black leading-none">{now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="h-[clamp(2.2rem,4vw,4rem)] w-px bg-white/15" />
              <div className="shrink-0 text-center">
                <div className="text-[clamp(0.7rem,0.9vw,0.9rem)] font-bold text-slate-400">本日の注文</div>
                <div className="text-[clamp(1.45rem,2vw,2.25rem)] font-black">{orders.length}<span className="ml-1 text-[clamp(0.85rem,1vw,1.1rem)]">件</span></div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,29vw)] gap-2 lg:gap-3">
            <section
              className={`min-h-0 rounded-xl border p-2 ${
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

          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,29vw)] gap-2 lg:gap-3">
            <section className="grid min-h-0 grid-rows-[auto_minmax(0,60dvh)] gap-2 lg:gap-3">
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1.5 lg:gap-2">
                  <MonitorStatusCard label="新規" count={stats.statusCounts.new} tone="red" icon={<ClipboardPlus />} />
                  <MonitorStatusCard label="確認済み" count={stats.statusCounts.confirmed} tone="amber" icon={<CheckCircle2 />} />
                  <MonitorStatusCard label="調理完了" count={stats.statusCounts.cooking} tone="blue" icon={<CookingPot />} />
                  <MonitorStatusCard label="完了" count={stats.statusCounts.completed} tone="green" icon={<PackageCheck />} />
                  <MonitorStatusCard label="中止" count={stats.statusCounts.cancelled} tone="slate" icon={<X />} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                  <MonitorStatusCard label="店頭受取" count={stats.pickupCount} tone="slate" icon={<ShoppingBag />} />
                  <MonitorStatusCard label="配達" count={stats.deliveryCount} tone="violet" icon={<Truck />} />
                </div>
              </div>

              <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="grid grid-cols-[70px_minmax(88px,1fr)_minmax(120px,1.45fr)_54px_66px_minmax(90px,1fr)] gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-1.5 text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-slate-300 xl:grid-cols-[82px_1.1fr_1.45fr_70px_88px_1fr]">
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

            <aside className="grid min-h-0 grid-rows-[1fr_1fr] gap-2 lg:gap-3">
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
    <div className={`grid h-full grid-cols-[44px_minmax(0,1fr)] items-center gap-2 ${flash ? "animate-pulse" : ""}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${iconClass}`}>
        {isNew ? <Bell className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
      </div>
      <div className={`grid min-w-0 grid-cols-[minmax(150px,0.9fr)_70px_minmax(92px,0.8fr)_minmax(160px,1.6fr)_58px_minmax(80px,0.8fr)] items-center gap-2 border-l pl-2 lg:gap-3 ${dividerClass}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-white ${badgeClass}`}>
            {isNew ? "NEW" : "ACTIVE"}
          </span>
          <span className="shrink-0 rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-slate-100">
            {displayShortOrderNumber(order)}
          </span>
          <span className="truncate text-[clamp(0.9rem,1.2vw,1.15rem)] font-black">{isNew ? "新着注文" : "未完了注文"}</span>
        </div>
        <HeroField label="受付" value={displayTime(order.pickup_time)} large />
        <HeroField label="注文者" value={order.customer_name} />
        <HeroField label="商品・数量" value={mainItem ? itemText : "-"} />
        <div className="min-w-0">
          <div className="text-[0.62rem] font-black leading-tight text-slate-300">受取</div>
          <span className={`mt-0.5 inline-flex max-w-full rounded px-1.5 py-0.5 text-[0.72rem] font-black leading-none text-white ${badgeClass}`}>
            {receiveTypeLabels[order.receive_type]}
          </span>
        </div>
        <HeroField label="備考" value={order.note || order.delivery_address || "なし"} accent={Boolean(order.note || order.delivery_address)} />
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="flex h-full min-h-10 items-center justify-center text-lg font-black text-slate-400">
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
      <div className="text-[0.62rem] font-black leading-tight text-slate-300">{label}</div>
      <div className={`mt-0.5 truncate font-black leading-tight ${large ? "text-[clamp(0.95rem,1.4vw,1.2rem)]" : "text-[clamp(0.82rem,1.1vw,1rem)]"} ${accent ? "text-red-300" : "text-white"}`}>
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
    <div className={`flex min-w-0 items-center gap-2 rounded-lg border p-1.5 xl:gap-2 xl:p-2 ${tones[tone]}`}>
      <div className="shrink-0 [&>svg]:h-[clamp(1.35rem,1.9vw,1.75rem)] [&>svg]:w-[clamp(1.35rem,1.9vw,1.75rem)]">{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-[clamp(0.74rem,0.9vw,0.92rem)] font-black">{label}</div>
        <div className="text-[clamp(1.3rem,2vw,1.9rem)] font-black leading-tight">{count}<span className="ml-1 text-[clamp(0.7rem,0.9vw,0.92rem)]">件</span></div>
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
      className={`grid grid-cols-[70px_minmax(88px,1fr)_minmax(120px,1.45fr)_54px_66px_minmax(90px,1fr)] gap-2 border-b border-white/10 px-3 py-1.5 xl:grid-cols-[82px_1.1fr_1.45fr_70px_88px_1fr] ${
        isAlert ? "bg-red-500/10" : ""
      }`}
    >
      <div>
        <div className="text-[clamp(0.65rem,0.8vw,0.78rem)] font-black text-slate-400">{displayShortOrderNumber(order)}</div>
        <div className={`text-[clamp(1rem,1.4vw,1.25rem)] font-black ${isAlert ? "text-red-300" : "text-slate-100"}`}>{displayTime(order.pickup_time)}</div>
      </div>
      <div className="truncate text-[clamp(0.86rem,1.05vw,1rem)] font-black text-white">{order.customer_name}</div>
      <div className="truncate text-[clamp(0.86rem,1.05vw,1rem)] font-bold text-slate-100">{itemSummary}</div>
      <div className="text-[clamp(0.86rem,1.05vw,1rem)] font-black text-white">x {quantity}</div>
      <div className="text-[clamp(0.86rem,1.05vw,1rem)] font-black text-slate-100">{receiveTypeLabels[order.receive_type]}</div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="truncate text-[clamp(0.82rem,1vw,1rem)] font-bold text-slate-300">{order.note || order.delivery_address || "-"}</div>
        <StatusBadge status={order.status} strong />
      </div>
    </div>
  );
}

function ProductPanel({ stats, compact = false }: { stats: ReturnType<typeof summarizeRemainingOrders>; compact?: boolean }) {
  return (
    <section className="min-h-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 xl:p-3">
      <div className="mb-2 flex items-end justify-between">
        <h2 className={compact ? "text-[clamp(1rem,1.4vw,1.25rem)] font-black" : "text-[clamp(1.2rem,1.8vw,1.5rem)] font-black"}>商品別合計</h2>
        <div className="text-[clamp(0.78rem,1vw,1rem)] font-black text-slate-300">残り {stats.totalItems} 個</div>
      </div>
      <div className="space-y-1.5">
        {stats.productTotals.slice(0, compact ? 4 : 8).map((item) => (
          <div key={item.product_name} className="flex items-center justify-between border-t border-white/10 pt-1.5">
            <div className="truncate text-[clamp(0.85rem,1.05vw,1rem)] font-bold text-slate-100">{item.product_name}</div>
            <div className="shrink-0 text-[clamp(1.3rem,1.8vw,1.6rem)] font-black text-white">{item.quantity}<span className="ml-1 text-xs">個</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingPanel({ orders, now }: { orders: OrderWithRelations[]; now: Date }) {
  return (
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-2 xl:p-3">
      <div className="mb-2">
        <h2 className="flex min-w-0 items-center truncate text-[clamp(0.95rem,1.2vw,1.1rem)] font-black leading-tight">
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
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-2 xl:p-3">
      <div className="mb-2">
        <h2 className="flex min-w-0 items-center truncate text-[clamp(0.95rem,1.2vw,1.1rem)] font-black leading-tight">
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
    <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-2 border-t border-white/10 pt-2 xl:grid-cols-[62px_minmax(0,1fr)_auto]">
      <div className="text-[clamp(0.85rem,1vw,1rem)] font-black text-red-300">{displayTime(order.pickup_time)}</div>
      <div className="min-w-0">
        <div className="truncate text-[clamp(0.85rem,1vw,1rem)] font-black text-white">{order.customer_name}</div>
        <div className="truncate text-[clamp(0.72rem,0.9vw,0.88rem)] font-bold text-slate-300">{itemText}</div>
        <div className="truncate text-[clamp(0.68rem,0.8vw,0.75rem)] font-bold text-red-300">{sub}</div>
      </div>
      <div className="self-center rounded-md bg-slate-700 px-2 py-1 text-[clamp(0.65rem,0.8vw,0.75rem)] font-black">{receiveTypeLabels[order.receive_type]}</div>
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
