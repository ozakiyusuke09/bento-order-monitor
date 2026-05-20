import type { DashboardStats } from "@/lib/types";

export function ProductTotals({
  stats,
  monitor = false,
  compact = false
}: {
  stats: DashboardStats;
  monitor?: boolean;
  compact?: boolean;
}) {
  return (
    <section
      className={
        monitor
          ? "rounded-lg border border-white/10 bg-white/5 p-5"
          : compact
            ? "rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
            : "rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
      }
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className={monitor ? "text-2xl font-black text-white" : "text-xl font-black text-slate-950"}>残り必要数</h2>
        <div className={monitor ? "text-lg font-bold text-slate-200" : "text-sm font-bold text-slate-500"}>
          合計 {stats.totalItems} 個
        </div>
      </div>
      <div className={compact ? "mt-3" : "mt-4"}>
        {stats.productTotals.length === 0 ? (
          <div className={monitor ? "text-slate-300" : "text-slate-500"}>本日の商品はまだありません。</div>
        ) : (
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200">
            {stats.productTotals.map((item, index) => (
              <div
                key={item.product_name}
                className={`flex min-w-0 items-center justify-between gap-3 border-slate-200 px-3 py-2 ${
                  index % 2 === 0 ? "border-r" : ""
                } ${index < stats.productTotals.length - 2 ? "border-b" : ""}`}
              >
                <div
                  className={
                    monitor
                      ? "truncate text-xl font-bold text-slate-100"
                      : compact
                        ? "truncate text-sm font-bold text-slate-800"
                        : "truncate font-bold text-slate-800"
                  }
                >
                  {item.product_name}
                </div>
                <div
                  className={
                    monitor
                      ? "shrink-0 text-3xl font-black text-white"
                      : compact
                        ? "shrink-0 text-base font-black text-slate-950"
                        : "shrink-0 text-2xl font-black text-slate-950"
                  }
                >
                  {item.quantity}
                  <span className="ml-1 text-xs font-bold">個</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
