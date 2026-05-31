"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  ShoppingBag,
  Volume2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { StatusBadge } from "@/components/status-badge";
import { displayDate, displayTime, todayString, tomorrowString } from "@/lib/date";
import { receiveTypeLabels } from "@/lib/constants";
import { summarizeOrders, summarizeRemainingOrders } from "@/lib/order-store";
import { displayShortOrderNumber } from "@/lib/order-number";
import { useOrders } from "@/hooks/use-orders";
import type { OrderWithRelations } from "@/lib/types";

export default function MonitorPage() {
  const { orders } = useOrders(todayString(), "monitor");
  const { orders: tomorrowOrders } = useOrders(tomorrowString(), "tomorrow");
  const stats = summarizeOrders(orders);
  const today = todayString();
  const tomorrow = tomorrowString();
  const todayOrders = useMemo(() => orders.filter((order) => order.pickup_date === today), [orders, today]);
  const todayProductStats = summarizeRemainingOrders(todayOrders);
  const tomorrowProductStats = summarizeRemainingOrders(tomorrowOrders);
  const [now, setNow] = useState(new Date());
  const [flashId, setFlashId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newOrderNotice, setNewOrderNotice] = useState(false);
  const seenOrderIdsRef = useRef<Set<string> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
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
    setNewOrderNotice(true);
    if (soundEnabled) playNotificationSound(audioContextRef);

    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashId(null);
      flashTimerRef.current = null;
    }, 10000);
    noticeTimerRef.current = window.setTimeout(() => {
      setNewOrderNotice(false);
      noticeTimerRef.current = null;
    }, 5000);
  }, [orders, soundEnabled]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "completed" && order.status !== "cancelled"),
    [orders]
  );
  const newestNewOrder =
    [...orders].filter((order) => order.status === "new").sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ??
    null;
  const featuredOrder = newestNewOrder ?? activeOrders[0] ?? orders[0];
  const heroMode = featuredOrder?.status === "new" ? "new" : "active";

  async function enableSound() {
    await getAudioContext(audioContextRef)?.resume();
    setSoundEnabled(true);
    playNotificationSound(audioContextRef);
  }

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
                <h1 className="truncate text-[clamp(1.5rem,2.8vw,3rem)] font-black leading-tight tracking-normal">受注モニター</h1>
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
                <button
                  type="button"
                  onClick={enableSound}
                  className={
                    soundEnabled
                      ? "inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-emerald-100"
                      : "inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-slate-100 hover:bg-white/15"
                  }
                >
                  <Volume2 className="h-4 w-4" />
                  通知音ON
                </button>
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
                <div className="text-[clamp(0.7rem,0.9vw,0.9rem)] font-bold text-slate-400">表示中</div>
                <div className="text-[clamp(1.45rem,2vw,2.25rem)] font-black">{orders.length}<span className="ml-1 text-[clamp(0.85rem,1vw,1.1rem)]">件</span></div>
              </div>
            </div>
          </header>
          {newOrderNotice ? (
            <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl border border-red-300 bg-red-600 px-6 py-3 text-xl font-black text-white shadow-2xl">
              新規注文が入りました
            </div>
          ) : null}

          <div className="grid min-h-0 grid-cols-1 gap-2 lg:gap-3">
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
          </div>

          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(420px,36vw)] gap-2 lg:gap-3">
            <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 lg:gap-3">
              <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto] items-stretch gap-1.5 lg:gap-2">
                <MonitorStatusCard label="新規" count={stats.statusCounts.new} tone="red" />
                <MonitorStatusCard label="確認済み" count={stats.statusCounts.confirmed} tone="amber" />
                <MonitorStatusCard label="調理完了" count={stats.statusCounts.cooking} tone="blue" />
                <MonitorStatusCard label="完了" count={stats.statusCounts.completed} tone="green" />
                <MonitorStatusCard label="中止" count={stats.statusCounts.cancelled} tone="slate" />
                <div className="flex min-w-[150px] items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 text-[clamp(0.68rem,0.85vw,0.8rem)] font-black text-slate-300">
                  <span className="whitespace-nowrap">店頭 {stats.pickupCount}</span>
                  <span className="text-slate-600">/</span>
                  <span className="whitespace-nowrap">配達 {stats.deliveryCount}</span>
                </div>
              </div>

              <section className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="grid grid-cols-[86px_minmax(96px,1fr)_minmax(220px,2fr)_64px_74px_minmax(110px,1fr)] gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[clamp(0.8rem,1vw,0.95rem)] font-black text-slate-300 xl:grid-cols-[96px_1fr_2.05fr_78px_92px_1fr]">
                  <div>時間</div>
                  <div>注文者</div>
                  <div>商品</div>
                  <div>数量</div>
                  <div>受取</div>
                  <div>備考</div>
                </div>
                <div className="monitor-scroll h-full overflow-auto">
                  {orders.slice(0, 14).map((order) => (
                    <MonitorOrderRow key={order.id} order={order} flash={flashId === order.id} today={todayString()} />
                  ))}
                </div>
              </section>
            </section>

            <aside className="grid min-h-0 grid-rows-[1fr_1fr] gap-2 lg:gap-3">
              <DayProductPanel title="今日の必要数" date={displayDate(today)} stats={todayProductStats} highlight />
              <DayProductPanel title="明日の必要数" date={displayDate(tomorrow)} stats={tomorrowProductStats} />
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
      <div className={`grid min-w-0 grid-cols-[minmax(88px,0.55fr)_70px_minmax(92px,0.8fr)_minmax(160px,1.6fr)_58px_minmax(80px,0.8fr)] items-center gap-2 border-l pl-2 lg:gap-3 ${dividerClass}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-white ${badgeClass}`}>
            {isNew ? "NEW" : "ACTIVE"}
          </span>
          <span className="shrink-0 rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-slate-100">
            {displayShortOrderNumber(order)}
          </span>
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
  tone
}: {
  label: string;
  count: number;
  tone: "red" | "amber" | "blue" | "green" | "violet" | "slate";
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
    <div className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-2 py-1 ${tones[tone]}`}>
      <div className="truncate text-[clamp(0.72rem,0.9vw,0.88rem)] font-black">{label}</div>
      <div className="shrink-0 text-[clamp(1rem,1.4vw,1.3rem)] font-black leading-none">
        {count}<span className="ml-0.5 text-[0.65rem]">件</span>
      </div>
    </div>
  );
}

function MonitorOrderRow({ order, flash, today }: { order: OrderWithRelations; flash: boolean; today: string }) {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isAlert = order.status === "new" || flash;
  const overdue = order.pickup_date < today && order.status !== "completed" && order.status !== "cancelled";

  return (
    <div
      className={`grid grid-cols-[86px_minmax(96px,1fr)_minmax(220px,2fr)_64px_74px_minmax(110px,1fr)] items-center gap-3 border-b border-white/10 px-3 py-2.5 xl:grid-cols-[96px_1fr_2.05fr_78px_92px_1fr] ${
        overdue ? "bg-red-600/20" : isAlert ? "bg-red-500/10" : ""
      }`}
    >
      <div>
        <div className="text-[clamp(0.7rem,0.9vw,0.86rem)] font-black text-slate-400">{displayShortOrderNumber(order)}</div>
        <div className={`text-[clamp(1.18rem,1.65vw,1.55rem)] font-black leading-tight ${isAlert ? "text-red-300" : "text-slate-100"}`}>{displayTime(order.pickup_time)}</div>
        {overdue ? <div className="mt-0.5 text-[0.68rem] font-black leading-tight text-red-200">{displayDate(order.pickup_date)} 超過</div> : null}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[clamp(1rem,1.25vw,1.18rem)] font-black text-white">{order.customer_name}</div>
        {overdue ? <div className="mt-1 inline-flex rounded bg-red-600 px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-white">日付超過・要対応</div> : null}
      </div>
      <MonitorItemBreakdown order={order} />
      <div className="text-[clamp(1rem,1.3vw,1.2rem)] font-black text-white">x {quantity}</div>
      <div className="text-[clamp(1rem,1.2vw,1.15rem)] font-black text-slate-100">{receiveTypeLabels[order.receive_type]}</div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="truncate text-[clamp(0.94rem,1.15vw,1.08rem)] font-bold text-slate-300">{order.note || order.delivery_address || "-"}</div>
        <StatusBadge status={order.status} strong />
      </div>
    </div>
  );
}

function getAudioContext(ref: MutableRefObject<AudioContext | null>) {
  if (typeof window === "undefined") return null;
  if (!ref.current) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    ref.current = new AudioContextClass();
  }
  return ref.current;
}

function playNotificationSound(ref: MutableRefObject<AudioContext | null>) {
  const context = getAudioContext(ref);
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.38);
}

function MonitorItemBreakdown({ order }: { order: OrderWithRelations }) {
  if (order.items.length === 0) {
    return <div className="text-[clamp(1rem,1.2vw,1.1rem)] font-bold text-slate-400">-</div>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {order.items.map((item) => (
        <span
          key={item.id}
          className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[clamp(0.95rem,1.16vw,1.08rem)] font-black leading-tight text-slate-50"
        >
          <span className="truncate">{item.product_name}</span>
          <span className="shrink-0 text-red-200">x{item.quantity}</span>
        </span>
      ))}
    </div>
  );
}

function DayProductPanel({
  title,
  date,
  stats,
  highlight = false
}: {
  title: string;
  date: string;
  stats: ReturnType<typeof summarizeRemainingOrders>;
  highlight?: boolean;
}) {
  return (
    <section className={`min-h-0 rounded-xl border p-2 xl:p-3 ${highlight ? "border-sky-400/45 bg-sky-500/12 shadow-[0_0_20px_rgba(56,189,248,0.12)]" : "border-white/10 bg-white/[0.04]"}`}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className={highlight ? "text-[clamp(1.35rem,1.9vw,1.8rem)] font-black leading-tight text-white" : "text-[clamp(1.15rem,1.55vw,1.45rem)] font-black leading-tight"}>{title}</h2>
          <div className="text-[clamp(0.72rem,0.9vw,0.85rem)] font-black text-slate-400">{date}</div>
        </div>
        <div className="text-right">
          <div className={highlight ? "text-[clamp(2.3rem,3.5vw,3.25rem)] font-black leading-none text-white" : "text-[clamp(1.8rem,2.8vw,2.6rem)] font-black leading-none text-white"}>{stats.totalItems}<span className="ml-1 text-[0.85rem]">個</span></div>
          <div className="text-[clamp(0.68rem,0.8vw,0.76rem)] font-black text-slate-400">未完了分</div>
        </div>
      </div>
      <div className={highlight ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-1.5"}>
        {stats.productTotals.map((item) => (
          <div key={item.product_name} className={highlight ? "flex min-w-0 items-center justify-between gap-2 rounded-md border border-sky-300/15 bg-white/[0.07] px-2.5 py-2" : "flex min-w-0 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5"}>
            <div className={highlight ? "min-w-0 truncate text-[clamp(0.95rem,1.15vw,1.08rem)] font-black text-slate-50" : "min-w-0 truncate text-[clamp(0.82rem,1vw,1rem)] font-black text-slate-100"}>{item.product_name}</div>
            <div className={highlight ? "shrink-0 text-[clamp(1.55rem,2.15vw,2rem)] font-black leading-none text-white" : "shrink-0 text-[clamp(1.25rem,1.75vw,1.7rem)] font-black leading-none text-white"}>{item.quantity}<span className="ml-1 text-[0.7rem]">個</span></div>
          </div>
        ))}
        {stats.productTotals.length === 0 ? <div className="col-span-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-slate-400">未完了の商品はありません。</div> : null}
      </div>
    </section>
  );
}
