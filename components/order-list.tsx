import { useState } from "react";
import Link from "next/link";
import { FileImage, MapPin, MessageSquare, Phone, Trash2 } from "lucide-react";
import { StatusActions } from "@/components/status-actions";
import { StatusBadge } from "@/components/status-badge";
import { displayTime, isPickupSoon } from "@/lib/date";
import { receiveTypeLabels } from "@/lib/constants";
import { softDeleteOrder } from "@/lib/order-store";
import { displayShortOrderNumber } from "@/lib/order-number";
import type { OrderWithRelations } from "@/lib/types";

export function OrderList({
  orders,
  onChanged
}: {
  orders: OrderWithRelations[];
  onChanged?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="hidden grid-cols-[64px_1fr_1.25fr_64px_86px_430px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-500 lg:grid">
        <div>時間</div>
        <div>注文者</div>
        <div>商品</div>
        <div>受取</div>
        <div>状態</div>
        <div>操作</div>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((order) => (
          <OrderListRow key={order.id} order={order} onChanged={onChanged} />
        ))}
      </div>
    </section>
  );
}

function OrderListRow({
  order,
  onChanged
}: {
  order: OrderWithRelations;
  onChanged?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isDeleted = Boolean(order.deleted_at);
  const soon = isPickupSoon(order.pickup_date, order.pickup_time) && order.status !== "completed" && !isDeleted;
  const itemSummary = order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ");

  async function deleteOrder() {
    const ok = window.confirm(
      `${order.customer_name} の注文を一覧から削除します。\n削除後は通常一覧・必要数・商品別合計には反映されません。\n記録は履歴に残ります。\nよろしいですか？`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await softDeleteOrder(order);
      onChanged?.();
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "注文の削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={isDeleted ? "bg-slate-50 opacity-75" : soon ? "bg-red-50" : "bg-white"}>
      <div className="grid gap-2 px-3 py-2.5 lg:grid-cols-[64px_1fr_1.25fr_64px_86px_430px] lg:items-center">
        <div className="flex items-center gap-2 lg:block">
          <div className="mb-0.5 text-xs font-black text-slate-500">{displayShortOrderNumber(order)}</div>
          <div className="text-xl font-black text-slate-950 lg:text-lg">{displayTime(order.pickup_time)}</div>
          {soon ? <span className="rounded-md bg-red-600 px-2 py-1 text-xs font-black text-white">時間注意</span> : null}
        </div>

        <div className="min-w-0">
          <Link href={`/orders/${order.id}`} className="block truncate text-base font-black text-slate-950 hover:underline">
            {order.customer_name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-slate-500">
            {order.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {order.phone}
              </span>
            ) : null}
            {order.delivery_address ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-violet-700">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{order.delivery_address}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-900">{itemSummary}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            {order.note ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">備考：{order.note}</span>
              </span>
            ) : null}
            {order.attachments.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <FileImage className="h-3.5 w-3.5" />
                添付 {order.attachments.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:block">
          <span
            className={
              order.receive_type === "delivery"
                ? "inline-flex rounded-md bg-violet-100 px-2 py-1 text-sm font-black text-violet-800"
                : "inline-flex rounded-md bg-slate-100 px-2 py-1 text-sm font-black text-slate-700"
            }
          >
            {receiveTypeLabels[order.receive_type]}
          </span>
          <div className="lg:hidden">
            {isDeleted ? (
              <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600">
                削除済み
              </span>
            ) : (
              <StatusBadge status={order.status} />
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          {isDeleted ? (
            <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600">
              削除済み
            </span>
          ) : (
            <StatusBadge status={order.status} />
          )}
        </div>

        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto">
          {isDeleted ? null : <StatusActions order={order} compact onChanged={onChanged} />}
          {isDeleted ? null : (
            <button
              type="button"
              disabled={deleting}
              onClick={deleteOrder}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "削除中" : "削除"}
            </button>
          )}
          <Link
            href={`/orders/${order.id}`}
            className="shrink-0 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white"
          >
            詳細
          </Link>
        </div>
      </div>
    </article>
  );
}
