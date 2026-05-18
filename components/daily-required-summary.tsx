import type { DashboardStats } from "@/lib/types";

export function DailyRequiredSummary({ stats }: { stats: DashboardStats }) {
  const topItems = stats.productTotals.slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-500">残り必要数</div>
          {topItems.length > 0 ? (
            <div className="mt-2 truncate text-xs font-bold text-slate-500">
              {topItems.map((item) => `${item.product_name} ${item.quantity}`).join(" / ")}
            </div>
          ) : (
            <div className="mt-2 text-xs font-bold text-slate-400">必要数はありません</div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-black text-slate-950">{stats.totalItems}</span>
          <span className="ml-1 text-sm font-black text-slate-700">個</span>
        </div>
      </div>
    </section>
  );
}
