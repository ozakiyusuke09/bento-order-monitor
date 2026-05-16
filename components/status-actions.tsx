"use client";

import { useState } from "react";
import { statusLabels, statusOrder } from "@/lib/constants";
import { updateOrderStatus } from "@/lib/order-store";
import type { OrderStatus, OrderWithRelations } from "@/lib/types";

export function StatusActions({
  order,
  compact = false,
  onChanged
}: {
  order: OrderWithRelations;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [saving, setSaving] = useState<OrderStatus | null>(null);

  async function changeStatus(status: OrderStatus) {
    setSaving(status);
    try {
      await updateOrderStatus(order, status);
      onChanged?.();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className={compact ? "flex shrink-0 flex-nowrap gap-1" : "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"}>
      {statusOrder
        .filter((status) => status !== order.status)
        .map((status) => (
          <button
            key={status}
            type="button"
            disabled={saving !== null}
            onClick={() => changeStatus(status)}
            className={
              compact
                ? "shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                : "min-h-11 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            }
          >
            {saving === status ? "更新中..." : statusLabels[status]}
          </button>
        ))}
    </div>
  );
}
