"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import Link from "next/link";
import {
  Bell,
  ShoppingBag,
  Volume2,
  VolumeX,
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
  const { orders: incompleteOrders } = useOrders(todayString(), "incomplete");
  const stats = summarizeOrders(orders);
  const today = todayString();
  const tomorrow = tomorrowString();
  const todayOrders = useMemo(() => orders.filter((order) => order.pickup_date === today), [orders, today]);
  const todayProductStats = summarizeRemainingOrders(todayOrders);
  const tomorrowProductStats = summarizeRemainingOrders(tomorrowOrders);
  const recentOrders = useMemo(
    () => [...incompleteOrders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [incompleteOrders]
  );
  const [now, setNow] = useState(new Date());
  const [flashId, setFlashId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundReady, setSoundReady] = useState(false);
  const [newOrderNotice, setNewOrderNotice] = useState(false);
  const seenOrderIdsRef = useRef<Set<string> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundAtRef = useRef(0);
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
    const currentIds = new Set(incompleteOrders.map((order) => order.id));
    if (!seenOrderIdsRef.current) {
      seenOrderIdsRef.current = currentIds;
      return;
    }

    const addedOrder = [...incompleteOrders]
      .filter((order) => !seenOrderIdsRef.current?.has(order.id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    seenOrderIdsRef.current = currentIds;
    if (!addedOrder) return;

    setFlashId(addedOrder.id);
    setNewOrderNotice(true);
    const nowMs = Date.now();
    if (soundEnabled && nowMs - lastSoundAtRef.current > 4000) {
      lastSoundAtRef.current = nowMs;
      playNotificationSound(audioContextRef);
    }

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
  }, [incompleteOrders, soundEnabled]);

  async function testSound() {
    const context = getAudioContext(audioContextRef);
    if (!context) return;
    await context.resume();
    setSoundEnabled(true);
    setSoundReady(context.state === "running");
    playNotificationSound(audioContextRef, true);
  }

  return (
    <AuthGuard>
      <main className="h-screen overflow-hidden bg-[#06101a] p-2 text-white lg:p-3">
        <div className="mx-auto grid h-full w-full max-w-[1900px] grid-rows-[auto_minmax(0,1fr)] gap-2 rounded-xl border border-slate-700 bg-gradient-to-br from-[#07131f] via-[#091923] to-[#03070c] p-2 shadow-2xl lg:gap-3 lg:p-3">
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
                  onClick={() => setSoundEnabled((current) => !current)}
                  className={
                    soundEnabled
                      ? "inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-emerald-100"
                      : "inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-[clamp(0.55rem,1vw,0.85rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.72rem,0.9vw,0.9rem)] font-black text-slate-100 hover:bg-white/15"
                  }
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  {soundEnabled ? "通知ON" : "通知OFF"}
                </button>
                <button
                  type="button"
                  onClick={testSound}
                  className={
                    soundReady
                      ? "rounded-md border border-white/15 bg-white/10 px-[clamp(0.5rem,0.9vw,0.75rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.68rem,0.85vw,0.82rem)] font-black text-slate-100 hover:bg-white/15"
                      : "rounded-md border border-amber-300/50 bg-amber-500/20 px-[clamp(0.5rem,0.9vw,0.75rem)] py-[clamp(0.45rem,0.8vw,0.65rem)] text-[clamp(0.68rem,0.85vw,0.82rem)] font-black text-amber-100 hover:bg-amber-500/30"
                  }
                >
                  {soundReady ? "音テスト" : "音を有効化"}
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

          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(420px,36vw)] grid-rows-[minmax(108px,14dvh)_minmax(0,1fr)] gap-2 lg:gap-3">
            <section
              className="col-start-1 row-start-1 min-h-0 rounded-xl border border-red-400/45 bg-red-500/10 p-2 shadow-[0_0_24px_rgba(248,113,113,0.16)]"
            >
              <RecentOrdersHero orders={recentOrders} flashId={flashId} today={today} tomorrow={tomorrow} />
            </section>

            <section className="col-start-1 row-start-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 lg:gap-3">
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
                <div className="grid grid-cols-[86px_minmax(110px,0.9fr)_minmax(180px,1.55fr)_58px_68px_minmax(180px,1.35fr)] gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[clamp(0.8rem,1vw,0.95rem)] font-black text-slate-300 xl:grid-cols-[96px_minmax(124px,0.9fr)_minmax(220px,1.8fr)_70px_82px_minmax(220px,1.45fr)]">
                  <div>時間</div>
                  <div>注文者/電話</div>
                  <div>商品</div>
                  <div>数量</div>
                  <div>受取</div>
                  <div>連絡・備考</div>
                </div>
                <div className="monitor-scroll h-full overflow-auto">
                  {orders.slice(0, 14).map((order) => (
                    <MonitorOrderRow key={order.id} order={order} flash={flashId === order.id} today={todayString()} />
                  ))}
                </div>
              </section>
            </section>

            <aside className="col-start-2 row-span-2 row-start-1 grid min-h-0 grid-rows-[1fr_1fr] gap-2 lg:gap-3">
              <DayProductPanel title="今日の必要数" date={displayDate(today)} stats={todayProductStats} highlight />
              <DayProductPanel title="明日の必要数" date={displayDate(tomorrow)} stats={tomorrowProductStats} />
            </aside>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function RecentOrdersHero({
  orders,
  flashId,
  today,
  tomorrow
}: {
  orders: OrderWithRelations[];
  flashId: string | null;
  today: string;
  tomorrow: string;
}) {
  if (orders.length === 0) {
    return <EmptyHero />;
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.45)]">
        <Bell className="h-6 w-6" />
      </div>
      <div className="grid min-h-0 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-l border-red-300/30 pl-2">
        <div className="min-w-[74px]">
          <div className="rounded bg-red-600 px-2 py-1 text-center text-[0.78rem] font-black leading-none text-white">NEW</div>
          <div className="mt-1 text-center text-[0.66rem] font-black text-red-100">新着注文</div>
        </div>
        <div className="grid min-w-0 grid-cols-5 gap-1.5">
          {orders.map((order) => (
            <RecentOrderCard key={order.id} order={order} flash={flashId === order.id} today={today} tomorrow={tomorrow} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentOrderCard({ order, flash, today, tomorrow }: { order: OrderWithRelations; flash: boolean; today: string; tomorrow: string }) {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const items = order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ") || "-";
  const dateLabel = getMonitorDateLabel(order.pickup_date, today, tomorrow);
  const isToday = order.pickup_date === today;
  const detail = order.receive_type === "delivery" ? order.delivery_address || "住所未入力" : order.note || "";
  const note = order.receive_type === "delivery" && order.note ? `備考: ${order.note}` : detail;

  return (
    <Link
      href={`/orders/${order.id}`}
      aria-label={`${order.customer_name}の新着注文詳細を開く`}
      className={`min-w-0 rounded-lg border px-2 py-1.5 transition hover:bg-white/[0.08] ${
        flash ? "animate-pulse border-red-300 bg-red-500/25" : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1">
        <span className={isToday ? "rounded bg-white/10 px-1.5 py-0.5 text-[0.62rem] font-black text-slate-200" : "rounded bg-red-600 px-1.5 py-0.5 text-[0.62rem] font-black text-white"}>
          {dateLabel}
        </span>
        <span className="rounded bg-red-600 px-1 py-0.5 text-[0.58rem] font-black leading-none text-white">NEW</span>
        <span className="truncate text-[0.68rem] font-black text-red-100">{displayShortOrderNumber(order)}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[clamp(0.95rem,1.15vw,1.15rem)] font-black leading-none text-white">{displayTime(order.pickup_time)}</span>
        <span className="min-w-0 truncate text-[clamp(0.78rem,0.95vw,0.9rem)] font-black text-white">{order.customer_name}</span>
      </div>
      <div className="mt-0.5 truncate text-[clamp(0.68rem,0.82vw,0.78rem)] font-black text-slate-100" title={items}>
        {items}
      </div>
      <div className="mt-0.5 flex min-w-0 items-center justify-between gap-1 text-[0.68rem] font-black text-slate-300">
        <span className="truncate">{receiveTypeLabels[order.receive_type]} {note ? `/ ${note}` : ""}</span>
        <span className="shrink-0 text-red-100">x {quantity}</span>
      </div>
    </Link>
  );
}

function EmptyHero() {
  return (
    <div className="flex h-full min-h-10 items-center justify-center text-lg font-black text-slate-400">
      未完了の新着注文はありません。
    </div>
  );
}

function getMonitorDateLabel(date: string, today: string, tomorrow: string) {
  if (date === today) return "今日";
  if (date === tomorrow) return "明日";
  return `予約 ${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
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
  const isDelivery = order.receive_type === "delivery";
  const contactText = order.phone || "電話番号なし";
  const destinationText = isDelivery ? order.delivery_address || "住所未入力" : "";
  const mainInfoText = isDelivery ? destinationText : order.note || "-";
  const subInfoText = isDelivery && order.note ? `備考：${order.note}` : "";

  return (
    <Link
      href={`/orders/${order.id}`}
      aria-label={`${order.customer_name}の注文詳細を開く`}
      className={`grid cursor-pointer grid-cols-[86px_minmax(110px,0.9fr)_minmax(180px,1.55fr)_58px_68px_minmax(180px,1.35fr)] items-center gap-3 border-b border-white/10 px-3 py-2.5 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 xl:grid-cols-[96px_minmax(124px,0.9fr)_minmax(220px,1.8fr)_70px_82px_minmax(220px,1.45fr)] ${
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
        <div className="mt-0.5 truncate text-[clamp(0.74rem,0.92vw,0.86rem)] font-black text-slate-300">{contactText}</div>
        {overdue ? <div className="mt-1 inline-flex rounded bg-red-600 px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-white">日付超過・要対応</div> : null}
      </div>
      <MonitorItemBreakdown order={order} />
      <div className="text-[clamp(1rem,1.3vw,1.2rem)] font-black text-white">x {quantity}</div>
      <div className="text-[clamp(1rem,1.2vw,1.15rem)] font-black text-slate-100">{receiveTypeLabels[order.receive_type]}</div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <div
            className={`truncate text-[clamp(0.88rem,1.08vw,1rem)] font-black ${isDelivery ? "text-violet-100" : "text-slate-300"}`}
            title={mainInfoText}
          >
            {isDelivery ? `配達先：${mainInfoText}` : mainInfoText}
          </div>
          {subInfoText ? (
            <div className="mt-0.5 truncate text-[clamp(0.72rem,0.88vw,0.82rem)] font-bold text-amber-200" title={order.note || undefined}>
              {subInfoText}
            </div>
          ) : null}
        </div>
        <StatusBadge status={order.status} strong />
      </div>
    </Link>
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

function playNotificationSound(ref: MutableRefObject<AudioContext | null>, force = false) {
  const context = getAudioContext(ref);
  if (!context) return;
  if (!force && context.state !== "running") return;
  [0, 0.58, 1.16].forEach((offset) => {
    playTone(context, context.currentTime + offset, 880, 0.2);
    playTone(context, context.currentTime + offset + 0.18, 660, 0.18);
  });
}

function playTone(context: AudioContext, startAt: number, frequency: number, duration: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.28, startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
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
