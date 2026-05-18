import { receiveTypeLabels, statusLabels, statusOrder, statusStyles } from "@/lib/constants";
import type { DashboardStats, OrderStatus, ReceiveType } from "@/lib/types";

type ActiveFilter =
  | { type: "status"; value: OrderStatus }
  | { type: "receive"; value: ReceiveType }
  | null;

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
  const receiveCards: Array<{ value: ReceiveType; count: number; className: string }> = [
    { value: "pickup", count: stats.pickupCount, className: "border-slate-400 bg-slate-700 text-white" },
    { value: "delivery", count: stats.deliveryCount, className: "border-violet-400 bg-violet-600 text-white" }
  ];

  return (
    <div className={monitor ? "space-y-3" : "space-y-3"}>
      <section className={monitor ? "space-y-2" : "space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"}>
        <div className={monitor ? "text-base font-black text-slate-200" : "text-sm font-black text-slate-500"}>ステータス別</div>
        <div className={monitor ? "grid grid-cols-2 gap-3 lg:grid-cols-5" : "grid grid-cols-2 gap-3 md:grid-cols-5"}>
          {statusOrder.map((status) => {
            const active = activeFilter?.type === "status" && activeFilter.value === status;
            return (
              <SummaryCard
                key={status}
                href={interactive ? withParam(baseHref, "status", status) : undefined}
                label={statusLabels[status]}
                value={stats.statusCounts[status]}
                monitor={monitor}
                active={active}
                monitorClass={statusStyles[status]}
              />
            );
          })}
        </div>
      </section>

      <section className={monitor ? "space-y-2" : "space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"}>
        <div className={monitor ? "text-base font-black text-slate-200" : "text-sm font-black text-slate-500"}>受取方法別</div>
        <div className={monitor ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 md:max-w-md"}>
          {receiveCards.map((card) => {
            const active = activeFilter?.type === "receive" && activeFilter.value === card.value;
            return (
              <SummaryCard
                key={card.value}
                href={interactive ? withParam(baseHref, "receive", card.value) : undefined}
                label={receiveTypeLabels[card.value]}
                value={card.count}
                monitor={monitor}
                active={active}
                monitorClass={card.className}
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
  monitorClass
}: {
  href?: string;
  label: string;
  value: number;
  monitor: boolean;
  active: boolean;
  monitorClass: string;
}) {
  const className = monitor
    ? `rounded-lg border p-4 ${monitorClass}`
    : active
      ? "rounded-lg border-2 border-slate-950 bg-white p-3 shadow-sm"
      : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400";

  const content = (
    <>
      <div className={monitor ? "text-lg font-bold opacity-90" : "text-sm font-bold text-slate-500"}>{label}</div>
      <div className={monitor ? "mt-1 text-4xl font-black" : "mt-1 text-3xl font-black text-slate-950"}>
        {value}
        <span className="ml-1 text-base font-bold">件</span>
      </div>
    </>
  );

  if (!href) return <div className={className}>{content}</div>;

  return (
    <a href={href} className={className} title={`${label}の注文を表示`}>
      {content}
    </a>
  );
}
