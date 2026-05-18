import { receiveTypeLabels, statusLabels, statusOrder, statusSoftStyles } from "@/lib/constants";
import type { DashboardStats, OrderStatus, ReceiveType } from "@/lib/types";

type ActiveFilter =
  | { type: "status"; value: OrderStatus }
  | { type: "receive"; value: ReceiveType }
  | null;

const statusCountStyles: Record<OrderStatus, string> = {
  new: "text-red-600",
  confirmed: "text-orange-600",
  cooking: "text-blue-600",
  completed: "text-emerald-600",
  cancelled: "text-slate-500"
};

export function SummaryStrip({
  stats,
  monitor = false,
  interactive = false,
  activeFilter = null,
  baseHref = "/orders"
}: {
  stats: DashboardStats;
  monitor?: boolean;
  interactive?: boolean;
  activeFilter?: ActiveFilter;
  baseHref?: string;
}) {
  const totalStatus = statusOrder.reduce((sum, status) => sum + stats.statusCounts[status], 0);
  const totalReceive = stats.pickupCount + stats.deliveryCount;
  const receiveCards: Array<{ value: ReceiveType; count: number; className: string }> = [
    { value: "pickup", count: stats.pickupCount, className: "bg-white text-slate-950" },
    { value: "delivery", count: stats.deliveryCount, className: "bg-violet-50 text-violet-700" }
  ];

  if (monitor) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-3">
          {statusOrder.map((status) => (
            <SummaryCard
              key={status}
              label={statusLabels[status]}
              value={stats.statusCounts[status]}
              monitor
              active={false}
              className={statusSoftStyles[status]}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {receiveCards.map((card) => (
            <SummaryCard key={card.value} label={receiveTypeLabels[card.value]} value={card.count} monitor active={false} className={card.className} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="space-y-2">
        <div className="text-sm font-bold text-slate-500">ステータス別 <span className="font-black">合計 {totalStatus}件</span></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {statusOrder.map((status) => {
            const active = activeFilter?.type === "status" && activeFilter.value === status;
            return (
              <SummaryCard
                key={status}
                href={interactive ? withParam(baseHref, "status", status) : undefined}
                label={statusLabels[status]}
                value={stats.statusCounts[status]}
                monitor={false}
                active={active}
                className={statusCountStyles[status]}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-sm font-bold text-slate-500">受取方法別 <span className="font-black">合計 {totalReceive}件</span></div>
        <div className="grid grid-cols-2 gap-2">
          {receiveCards.map((card) => {
            const active = activeFilter?.type === "receive" && activeFilter.value === card.value;
            return (
              <SummaryCard
                key={card.value}
                href={interactive ? withParam(baseHref, "receive", card.value) : undefined}
                label={card.value === "delivery" ? `🚚 ${receiveTypeLabels[card.value]}` : receiveTypeLabels[card.value]}
                value={card.count}
                monitor={false}
                active={active}
                className={card.className}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function withParam(baseHref: string, key: string, value: string) {
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}${key}=${value}`;
}

function SummaryCard({
  href,
  label,
  value,
  monitor,
  active,
  className
}: {
  href?: string;
  label: string;
  value: number;
  monitor: boolean;
  active: boolean;
  className: string;
}) {
  const baseClass = monitor
    ? `rounded-lg border p-3 ${className}`
    : active
      ? `rounded-lg border-2 border-slate-950 px-3 py-3 shadow-sm ${className}`
      : `rounded-lg border border-slate-200 px-3 py-3 shadow-sm ${className}`;
  const content = (
    <div className={monitor ? "space-y-1" : "flex min-h-11 items-center justify-between gap-2 sm:block"}>
      <div className={monitor ? "text-base font-black opacity-90" : "truncate text-xs font-bold text-slate-500"}>{label}</div>
      <div className={monitor ? "text-3xl font-black" : "text-xl font-black sm:mt-1 sm:text-2xl"}>
        {value}
        <span className="ml-1 text-xs font-bold">件</span>
      </div>
    </div>
  );

  if (!href) return <div className={baseClass}>{content}</div>;

  return (
    <a href={href} className={baseClass} title={`${label}の注文を表示`}>
      {content}
    </a>
  );
}
