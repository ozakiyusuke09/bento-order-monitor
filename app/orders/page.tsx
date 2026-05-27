"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw, X } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { DailyRequiredSummary } from "@/components/daily-required-summary";
import { OrderList } from "@/components/order-list";
import { ProductTotals } from "@/components/product-totals";
import { SummaryStrip } from "@/components/summary-strip";
import { receiveTypeLabels, statusLabels } from "@/lib/constants";
import { summarizeOrders, summarizeRemainingOrders } from "@/lib/order-store";
import { useOrders, type OrdersMode } from "@/hooks/use-orders";
import { displayDate, todayString, tomorrowString } from "@/lib/date";
import type { OrderStatus, ReceiveType } from "@/lib/types";

type ActiveFilter =
  | { type: "status"; value: OrderStatus }
  | { type: "receive"; value: ReceiveType }
  | { type: "handoff"; value: "before" | "done" }
  | null;

const validStatuses: OrderStatus[] = ["new", "confirmed", "cooking", "completed", "cancelled"];

export default function OrdersPage() {
  const today = todayString();
  const tomorrow = tomorrowString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<OrdersMode>("incomplete");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const { orders, loading, refreshing, lastUpdatedAt, error, refresh } = useOrders(selectedDate, mode);
  const stats = summarizeOrders(orders);
  const remainingStats = summarizeRemainingOrders(orders);

  useEffect(() => {
    function readQuery() {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      const date = params.get("date");
      const status = params.get("status") as OrderStatus | null;
      const receive = params.get("receive") as ReceiveType | null;
      const handoff = params.get("handoff");

      if (view === "tomorrow") {
        setMode("tomorrow");
        setSelectedDate(tomorrow);
      } else if (view === "reservations") {
        setMode("reservations");
      } else if (view === "history") {
        setMode("past");
      } else if (date) {
        setMode("date");
        setSelectedDate(date);
      } else {
        setMode("incomplete");
        setSelectedDate(today);
      }

      if (status && validStatuses.includes(status)) {
        setActiveFilter({ type: "status", value: status });
      } else if (receive === "pickup" || receive === "delivery") {
        setActiveFilter({ type: "receive", value: receive });
      } else if (handoff === "before" || handoff === "done") {
        setActiveFilter({ type: "handoff", value: handoff });
      } else {
        setActiveFilter(null);
      }
    }

    readQuery();
    window.addEventListener("popstate", readQuery);
    return () => window.removeEventListener("popstate", readQuery);
  }, [today, tomorrow]);

  const filteredOrders = useMemo(() => {
    if (!activeFilter) return orders;
    if (activeFilter.type === "status") return orders.filter((order) => order.status === activeFilter.value);
    if (activeFilter.type === "handoff") {
      if (activeFilter.value === "done") return orders.filter((order) => order.status === "completed");
      return orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
    }
    return orders.filter((order) => order.receive_type === activeFilter.value);
  }, [activeFilter, orders]);

  const baseHref =
    mode === "incomplete"
      ? "/orders"
      : mode === "tomorrow"
        ? "/orders?view=tomorrow"
        : mode === "reservations" || mode === "future"
          ? "/orders?view=reservations"
          : mode === "past"
            ? "/orders?view=history"
            : `/orders?date=${selectedDate}`;
  const headingLabel =
    mode === "incomplete"
      ? "未完了"
      : mode === "tomorrow"
        ? "明日の注文"
        : mode === "reservations" || mode === "future"
          ? "予約一覧"
          : mode === "past"
            ? "履歴"
            : "今日の注文";
  const dateLabel =
    mode === "incomplete"
      ? "日付を跨いだ未完了も表示"
      : mode === "tomorrow"
        ? displayDate(tomorrow)
        : mode === "reservations" || mode === "future"
          ? "明後日以降"
          : mode === "past"
            ? "過去分"
            : displayDate(selectedDate);
  const filterLabel =
    activeFilter?.type === "status"
      ? statusLabels[activeFilter.value]
      : activeFilter?.type === "receive"
        ? receiveTypeLabels[activeFilter.value]
        : activeFilter?.type === "handoff"
          ? activeFilter.value === "done"
            ? "受け渡し済み"
            : "受け渡し前"
        : null;

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-[1480px] px-4 pb-24 pt-3 sm:px-6 sm:pb-10 lg:px-8 lg:pt-5">
          <div className="mb-3 flex items-end justify-between gap-3 lg:hidden">
            <div>
              <div className="text-sm font-bold text-slate-500">{dateLabel}</div>
              <h1 className="text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-[34px]">{headingLabel}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">更新</span>
              </button>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500 sm:hidden">
            <span>5秒ごとに自動更新</span>
            <span>
              {lastUpdatedAt
                ? lastUpdatedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "-"}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(460px,2fr)] lg:items-start xl:gap-5">
            <div className="space-y-3">
              <div className="hidden flex-wrap items-center gap-2 text-sm font-bold text-slate-700 lg:flex">
                <span>{dateLabel}</span>
                <span>
                  最終更新{" "}
                  {lastUpdatedAt
                    ? lastUpdatedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "-"}
                </span>
                <label className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  日付指定
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      window.location.href = `/orders?date=${event.target.value}`;
                    }}
                    className="h-8 w-32 rounded border border-slate-200 px-2 text-sm font-bold"
                  />
                </label>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>更新</span>
                </button>
              </div>
              <div className="grid w-full grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:inline-grid sm:w-auto">
                <NavPill href="/orders" active={mode === "incomplete" && !activeFilter} label="未完了" />
                <NavPill href={`/orders?date=${today}`} active={mode === "date" && selectedDate === today && !activeFilter} label="今日" />
                <NavPill href="/orders?view=tomorrow" active={mode === "tomorrow" && !activeFilter} label="明日" />
                <NavPill href="/orders?view=reservations" active={(mode === "reservations" || mode === "future") && !activeFilter} label="予約" />
                <NavPill href="/orders?view=history" active={mode === "past"} label="履歴" />
              </div>
              <div className="lg:hidden">
                <DailyRequiredSummary stats={remainingStats} />
              </div>
              <SummaryStrip
                stats={stats}
                interactive
                activeFilter={activeFilter?.type === "handoff" ? null : activeFilter}
                baseHref={baseHref}
              />
            </div>
            <div className="hidden lg:block">
              <ProductTotals stats={remainingStats} compact />
            </div>
          </div>

          {filterLabel ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="font-bold text-slate-700">
                表示中: {filterLabel} {filteredOrders.length}件
              </div>
              <a
                href={baseHref}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700"
              >
                <X className="h-4 w-4" />
                全件表示
              </a>
            </div>
          ) : null}

          <div className="mt-4">
            {loading ? <div className="text-slate-500">読み込み中...</div> : null}
            {error ? <div className="rounded-md bg-red-50 p-4 font-bold text-red-700">{error}</div> : null}
            {!loading && filteredOrders.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
                表示する注文はありません。
              </div>
            ) : null}
            {filteredOrders.length > 0 ? <OrderList orders={filteredOrders} onChanged={refresh} /> : null}
          </div>
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function NavPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={
        active
          ? "flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-md bg-slate-950 px-2 text-xs font-black text-white sm:px-5 sm:text-sm"
          : "flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-xs font-black text-slate-800 hover:bg-slate-50 sm:px-5 sm:text-sm"
      }
    >
      {label}
    </a>
  );
}
