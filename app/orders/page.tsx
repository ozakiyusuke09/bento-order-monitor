"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCw, X } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { DailyRequiredSummary } from "@/components/daily-required-summary";
import { OrderList } from "@/components/order-list";
import { ProductTotals } from "@/components/product-totals";
import { SummaryStrip } from "@/components/summary-strip";
import { receiveTypeLabels, statusLabels } from "@/lib/constants";
import { summarizeOrders, summarizeRemainingOrders } from "@/lib/order-store";
import { useOrders, type OrdersMode } from "@/hooks/use-orders";
import { displayDate, todayString } from "@/lib/date";
import type { OrderStatus, ReceiveType } from "@/lib/types";

type ActiveFilter =
  | { type: "status"; value: OrderStatus }
  | { type: "receive"; value: ReceiveType }
  | { type: "handoff"; value: "before" | "done" }
  | null;

const validStatuses: OrderStatus[] = ["new", "confirmed", "cooking", "completed", "cancelled"];

export default function OrdersPage() {
  const today = todayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<OrdersMode>("date");
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

      if (view === "reservations") {
        setMode("future");
      } else if (view === "history") {
        setMode("past");
      } else {
        setMode("date");
        setSelectedDate(date || today);
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
  }, [today]);

  const filteredOrders = useMemo(() => {
    if (!activeFilter) return orders;
    if (activeFilter.type === "status") return orders.filter((order) => order.status === activeFilter.value);
    if (activeFilter.type === "handoff") {
      if (activeFilter.value === "done") return orders.filter((order) => order.status === "completed");
      return orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
    }
    return orders.filter((order) => order.receive_type === activeFilter.value);
  }, [activeFilter, orders]);

  const baseHref = mode === "future" ? "/orders?view=reservations" : mode === "past" ? "/orders?view=history" : `/orders?date=${selectedDate}`;
  const headingLabel = mode === "future" ? "予約一覧" : mode === "past" ? "履歴" : "注文一覧";
  const dateLabel = mode === "future" ? "明日以降" : mode === "past" ? "過去分" : displayDate(selectedDate);
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
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:pb-10 sm:pt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-5 sm:gap-4">
            <div>
              <div className="text-sm font-bold text-slate-500">{dateLabel}</div>
              <h1 className="text-3xl font-black text-slate-950">{headingLabel}</h1>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <div className="text-xs font-bold text-slate-500 sm:text-right">
                <div>5秒ごとに自動更新</div>
                <div>
                  最終更新{" "}
                  {lastUpdatedAt
                    ? lastUpdatedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "-"}
                </div>
              </div>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:min-h-11 sm:px-4 sm:py-3"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                更新
              </button>
              <Link
                href="/orders/new"
                className="hidden min-h-11 items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white sm:inline-flex"
              >
                <Plus className="h-5 w-5" />
                注文登録
              </Link>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:mb-4 sm:flex sm:flex-wrap sm:gap-2 sm:p-3">
            <NavPill href={`/orders?date=${selectedDate || today}`} active={mode === "date" && !activeFilter} label="すべて" />
            <NavPill
              href={`/orders?date=${selectedDate || today}&handoff=before`}
              active={mode === "date" && activeFilter?.type === "handoff" && activeFilter.value === "before"}
              label="受渡前"
            />
            <NavPill
              href={`/orders?date=${selectedDate || today}&handoff=done`}
              active={mode === "date" && activeFilter?.type === "handoff" && activeFilter.value === "done"}
              label="受渡済"
            />
            <NavPill href="/orders?view=history" active={mode === "past"} label="履歴" />
            <label className="col-span-4 mt-1 hidden items-center gap-2 text-sm font-bold text-slate-600 sm:ml-auto sm:mt-0 sm:flex">
              <CalendarDays className="h-4 w-4" />
              日付指定
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  window.location.href = `/orders?date=${event.target.value}`;
                }}
                className="h-9 rounded-md border border-slate-300 px-2"
              />
            </label>
          </div>

          <div className="space-y-4">
            <DailyRequiredSummary stats={remainingStats} />
            <SummaryStrip
              stats={stats}
              interactive
              activeFilter={activeFilter?.type === "handoff" ? null : activeFilter}
              baseHref={baseHref}
            />
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

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_260px]">
            <div>
              {loading ? <div className="text-slate-500">読み込み中...</div> : null}
              {error ? <div className="rounded-md bg-red-50 p-4 font-bold text-red-700">{error}</div> : null}
              {!loading && filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
                  表示する注文はありません。
                </div>
              ) : null}
              {filteredOrders.length > 0 ? <OrderList orders={filteredOrders} onChanged={refresh} /> : null}
            </div>
            <ProductTotals stats={remainingStats} compact />
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
          ? "flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-sm font-black text-white"
          : "flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
      }
    >
      {label}
    </a>
  );
}
