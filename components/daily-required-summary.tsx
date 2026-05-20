import type { DashboardStats } from "@/lib/types";

export function DailyRequiredSummary({ stats }: { stats: DashboardStats }) {
  const topItems = stats.productTotals.slice(0, 6);

  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-500">残り必要数</div>
          {topItems.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-6">
              {topItems.map((item) => (
                <div key={item.product_name} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1">
                  <span className="truncate text-xs font-bold text-slate-600">{item.product_name}</span>
                  <span className="shrink-0 text-sm font-black text-slate-950">{item.quantity}</span>
                </div>
              ))}
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
