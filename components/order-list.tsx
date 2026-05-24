"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { displayTime, isPickupSoon } from "@/lib/date";
import { receiveTypeLabels, statusLabels, statusSoftStyles } from "@/lib/constants";
import { softDeleteOrder, updateOrderStatus } from "@/lib/order-store";
import { displayShortOrderNumber } from "@/lib/order-number";
import type { OrderStatus, OrderWithRelations } from "@/lib/types";

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "cooking",
  cooking: "completed"
};

export function OrderList({
  orders,
  onChanged
}: {
  orders: OrderWithRelations[];
  onChanged?: () => void;
}) {
  return (
    <section className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="hidden grid-cols-[72px_72px_minmax(105px,0.7fr)_minmax(380px,2.25fr)_70px_96px_214px] gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm font-black text-slate-500 lg:grid">
        <div>時間</div>
        <div>No.</div>
        <div>注文者</div>
        <div>商品</div>
        <div>受取</div>
        <div>状態</div>
        <div>操作</div>
      </div>
      <div className="space-y-2 lg:divide-y lg:divide-slate-100 lg:space-y-0">
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
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const isDeleted = Boolean(order.deleted_at);
  const soon = isPickupSoon(order.pickup_date, order.pickup_time) && order.status !== "completed" && !isDeleted;
  const nextStatus = isDeleted ? undefined : nextStatusByCurrent[order.status];

  async function deleteOrder() {
    const ok = window.confirm(
      `${order.customer_name} の注文を一覧から削除します。\n削除後は通常一覧・必要数・商品別合計には反映されません。\n履歴には残ります。\nよろしいですか？`
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

  async function advanceStatus(event?: { stopPropagation: () => void }) {
    event?.stopPropagation();
    if (!nextStatus) return;

    setSavingStatus(true);
    try {
      await updateOrderStatus(order, nextStatus);
      onChanged?.();
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "ステータス変更に失敗しました。");
    } finally {
      setSavingStatus(false);
    }
  }

  function openDetail() {
    router.push(`/orders/${order.id}`);
  }

  return (
    <article className={isDeleted ? "rounded-lg border border-slate-200 bg-slate-50 opacity-75 lg:rounded-none lg:border-0" : soon ? "rounded-lg border border-red-100 bg-red-50 lg:rounded-none lg:border-0" : "rounded-lg border border-slate-200 bg-white shadow-sm lg:rounded-none lg:border-0 lg:shadow-none"}>
      <div
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") openDetail();
        }}
        className="block w-full px-3 py-2 text-left lg:hidden"
      >
        <div className="space-y-2">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-500">{displayShortOrderNumber(order)}</span>
              <span className={`text-lg font-black ${soon ? "text-red-600" : "text-slate-950"}`}>{displayTime(order.pickup_time)}</span>
              <span
                className={
                  order.receive_type === "delivery"
                    ? "shrink-0 whitespace-nowrap rounded-md bg-violet-100 px-2 py-0.5 text-xs font-black text-violet-800"
                    : "shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700"
                }
              >
                {receiveTypeLabels[order.receive_type]}
              </span>
              {isDeleted ? (
                <span className="shrink-0 whitespace-nowrap rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">削除済み</span>
              ) : (
                <CompactStatus status={order.status} />
              )}
            </div>
            <div className="mt-1 truncate text-base font-black text-slate-950">{order.customer_name}</div>
            <ProductChips order={order} mobile />
            {order.note ? <OrderNoteLine note={order.note} mobile /> : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-black text-slate-700 shadow-sm">
              詳細
            </span>
            {nextStatus ? (
              <button
                type="button"
                onClick={advanceStatus}
                onKeyDown={(event) => {
                  event.stopPropagation();
                }}
                className="min-w-[96px] rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900 shadow-sm"
              >
                {savingStatus ? "更新中" : statusLabels[nextStatus]}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-[72px_72px_minmax(105px,0.7fr)_minmax(380px,2.25fr)_70px_96px_214px] items-center gap-3 px-4 py-2.5 lg:grid">
        <div>
          <div className={`text-lg font-black ${soon ? "text-red-600" : "text-slate-950"}`}>{displayTime(order.pickup_time)}</div>
          {soon ? <div className="mt-1 text-xs font-black text-red-600">時間注意</div> : null}
        </div>

        <div className="text-sm font-black text-slate-500">{displayShortOrderNumber(order)}</div>

        <div className="min-w-0">
          <Link href={`/orders/${order.id}`} className="block truncate text-base font-black text-slate-950 hover:underline">
            {order.customer_name}
          </Link>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-slate-500">
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
          <ProductChips order={order} />
          {order.note ? <OrderNoteLine note={order.note} /> : null}
        </div>

        <div>
          <span
            className={
              order.receive_type === "delivery"
                ? "inline-flex rounded-md bg-violet-100 px-2 py-1 text-sm font-black text-violet-800"
                : "inline-flex rounded-md bg-slate-100 px-2 py-1 text-sm font-black text-slate-700"
            }
          >
            {receiveTypeLabels[order.receive_type]}
          </span>
        </div>

        <div>{isDeleted ? <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-sm font-bold text-slate-600">削除済み</span> : <StatusBadge status={order.status} />}</div>

        <div className="flex flex-nowrap items-center gap-1.5">
          {nextStatus ? (
            <button
              type="button"
              disabled={savingStatus}
              onClick={advanceStatus}
              className="shrink-0 rounded-md border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-black text-orange-700 shadow-sm hover:bg-orange-50 disabled:opacity-60"
            >
              {savingStatus ? "更新中" : statusLabels[nextStatus]}
            </button>
          ) : null}
          <Link href={`/orders/${order.id}`} className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800 shadow-sm hover:bg-slate-50">
            詳細
          </Link>
          {isDeleted ? null : (
            <button
              type="button"
              disabled={deleting}
              onClick={deleteOrder}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "削除中" : "削除"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductChips({ order, mobile = false }: { order: OrderWithRelations; mobile?: boolean }) {
  if (order.items.length === 0) {
    return <div className="text-sm font-bold text-slate-500">-</div>;
  }

  return (
    <div className={mobile ? "mt-1 flex flex-wrap gap-1" : "flex flex-wrap gap-1"}>
      {order.items.map((item) => (
        <span
          key={item.id}
          className={
            mobile
              ? "inline-flex max-w-full items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-black text-slate-800 shadow-[0_1px_1px_rgba(15,23,42,0.03)]"
              : "inline-flex max-w-full items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-800 shadow-[0_1px_1px_rgba(15,23,42,0.03)]"
          }
        >
          <span className="truncate">{item.product_name}</span>
          <span className="ml-1 shrink-0">x{item.quantity}</span>
        </span>
      ))}
    </div>
  );
}

function OrderNoteLine({ note, mobile = false }: { note: string; mobile?: boolean }) {
  return (
    <div
      className={
        mobile
          ? "mt-1 truncate rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800"
          : "mt-1 truncate text-xs font-bold text-amber-700"
      }
      title={note}
    >
      備考：{note}
    </div>
  );
}

function CompactStatus({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-black ${statusSoftStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
