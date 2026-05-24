"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getIncompleteOrders,
  getMonitorOrders,
  getOrdersByDate,
  getPastOrders,
  getReservationOrders,
  getTomorrowOrders,
  subscribeToOrderChanges
} from "@/lib/order-store";
import { addDaysString, todayString, tomorrowString } from "@/lib/date";
import type { OrderWithRelations } from "@/lib/types";

export type OrdersMode = "date" | "incomplete" | "tomorrow" | "reservations" | "future" | "past" | "monitor";

export function useOrders(date = todayString(), mode: OrdersMode = "date") {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const today = todayString();
      const next =
        mode === "incomplete"
          ? await getIncompleteOrders()
          : mode === "tomorrow"
            ? await getTomorrowOrders(tomorrowString())
            : mode === "reservations" || mode === "future"
              ? await getReservationOrders(addDaysString(today, 1))
              : mode === "past"
                ? await getPastOrders(today)
                : mode === "monitor"
                  ? await getMonitorOrders(today)
                  : await getOrdersByDate(date);
      setOrders(next);
      setLastUpdatedAt(new Date());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文の取得に失敗しました。");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, mode]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const unsubscribe = subscribeToOrderChanges(refresh);
    const pollingTimer = window.setInterval(refresh, 5000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      window.clearInterval(pollingTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  return { orders, loading, refreshing, lastUpdatedAt, error, refresh };
}
