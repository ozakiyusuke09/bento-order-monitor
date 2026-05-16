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
        <h2 className={monitor ? "text-2xl font-black text-white" : "text-xl font-black text-slate-950"}>
          商品別合計
        </h2>
        <div className={monitor ? "text-lg font-bold text-slate-200" : "text-sm font-bold text-slate-500"}>
          合計 {stats.totalItems} 個
        </div>
      </div>
      <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
        {stats.productTotals.length === 0 ? (
          <div className={monitor ? "text-slate-300" : "text-slate-500"}>本日の商品はまだありません。</div>
        ) : (
          stats.productTotals.map((item) => (
            <div key={item.product_name} className="flex items-center justify-between gap-4">
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
                    ? "text-3xl font-black text-white"
                    : compact
                      ? "text-xl font-black text-slate-950"
                      : "text-2xl font-black text-slate-950"
                }
              >
                {item.quantity}
                <span className="ml-1 text-sm font-bold">個</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
