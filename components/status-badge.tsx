import { statusLabels, statusSoftStyles, statusStyles } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status, strong = false }: { status: OrderStatus; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-bold ${
        strong ? statusStyles[status] : statusSoftStyles[status]
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
