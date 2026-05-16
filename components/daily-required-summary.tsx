import type { DashboardStats } from "@/lib/types";

export function DailyRequiredSummary({ stats }: { stats: DashboardStats }) {
  const topItems = stats.productTotals.slice(0, 8);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-500">これから作る分</div>
          <h2 className="text-2xl font-black text-slate-950">残り必要数 {stats.totalItems} 個</h2>
        </div>
        <div className="text-sm font-bold text-slate-500">完了・キャンセルを除く</div>
      </div>

      {topItems.length === 0 ? (
        <div className="mt-4 rounded-md bg-slate-50 p-4 text-slate-500">残り必要数はありません。</div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {topItems.map((item) => (
            <div key={item.product_name} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <div className="min-w-0 truncate text-sm font-black text-slate-800">{item.product_name}</div>
              <div className="shrink-0 text-2xl font-black text-slate-950">
                {item.quantity}
                <span className="ml-1 text-xs font-bold text-slate-500">個</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
