"use client";

import { useCallback, useEffect, useState } from "react";
import { getFutureOrders, getOrdersByDate, getPastOrders, subscribeToOrderChanges } from "@/lib/order-store";
import { todayString } from "@/lib/date";
import type { OrderWithRelations } from "@/lib/types";

export type OrdersMode = "date" | "future" | "past";

export function useOrders(date = todayString(), mode: OrdersMode = "date") {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next =
        mode === "future" ? await getFutureOrders(todayString()) : mode === "past" ? await getPastOrders(todayString()) : await getOrdersByDate(date);
      setOrders(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文の取得に失敗しました。");
    } finally {
      setLoading(false);
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

  return { orders, loading, error, refresh };
}
