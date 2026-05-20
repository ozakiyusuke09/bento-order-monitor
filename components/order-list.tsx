"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileImage, MapPin, MessageSquare, Phone, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { displayTime, isPickupSoon } from "@/lib/date";
import { receiveTypeLabels, statusLabels } from "@/lib/constants";
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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="hidden grid-cols-[72px_72px_minmax(130px,1fr)_minmax(180px,1.3fr)_70px_104px_230px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-500 lg:grid">
        <div>時間</div>
        <div>No.</div>
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
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const isDeleted = Boolean(order.deleted_at);
  const soon = isPickupSoon(order.pickup_date, order.pickup_time) && order.status !== "completed" && !isDeleted;
  const nextStatus = isDeleted ? undefined : nextStatusByCurrent[order.status];
  const itemLines = summarizeItemsForList(order);
  const itemSummary = summarizeItemsForMobile(order);

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
    <article className={isDeleted ? "bg-slate-50 opacity-75" : soon ? "bg-red-50" : "bg-white"}>
      <div
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") openDetail();
        }}
        className="block w-full px-3 py-2.5 text-left lg:hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-500">{displayShortOrderNumber(order)}</span>
              <span className={`text-lg font-black ${soon ? "text-red-600" : "text-slate-950"}`}>{displayTime(order.pickup_time)}</span>
              <span
                className={
                  order.receive_type === "delivery"
                    ? "rounded-md bg-violet-100 px-2 py-0.5 text-xs font-black text-violet-800"
                    : "rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700"
                }
              >
                {receiveTypeLabels[order.receive_type]}
              </span>
              {isDeleted ? (
                <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">削除済み</span>
              ) : (
                <StatusBadge status={order.status} />
              )}
            </div>
            <div className="mt-1 truncate text-base font-black text-slate-950">{order.customer_name}</div>
            <div className="mt-0.5 truncate text-sm font-bold text-slate-700">{itemSummary}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
              {order.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {order.phone}
                </span>
              ) : null}
              {order.note ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{order.note}</span>
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
          <div className="flex shrink-0 flex-col items-end gap-2">
            {nextStatus ? (
              <button
                type="button"
                onClick={advanceStatus}
                onKeyDown={(event) => {
                  event.stopPropagation();
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900 shadow-sm"
              >
                {savingStatus ? "更新中" : statusLabels[nextStatus]}
              </button>
            ) : null}
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-[72px_72px_minmax(130px,1fr)_minmax(180px,1.3fr)_70px_104px_230px] items-center gap-3 px-4 py-3 lg:grid">
        <div>
          <div className={`text-xl font-black ${soon ? "text-red-600" : "text-slate-950"}`}>{displayTime(order.pickup_time)}</div>
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

        <div className="min-w-0 text-sm font-bold text-slate-900">
          {itemLines.map((line, index) => (
            <div key={`${order.id}-${index}`} className={index === 0 ? "truncate" : "truncate text-slate-500"}>
              {line}
            </div>
          ))}
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
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              {savingStatus ? "更新中" : statusLabels[nextStatus]}
            </button>
          ) : null}
          <Link href={`/orders/${order.id}`} className="shrink-0 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white">
            詳細
          </Link>
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
        </div>
      </div>
    </article>
  );
}

function summarizeItemsForList(order: OrderWithRelations) {
  if (order.items.length === 0) return ["-"];
  if (order.items.length === 1) return [`${order.items[0].product_name} x${order.items[0].quantity}`];
  if (order.items.length === 2) {
    return order.items.map((item, index) => `${index === 0 ? "" : "+ "}${item.product_name} x${item.quantity}`);
  }
  const first = order.items[0];
  return [`${first.product_name} x${first.quantity}`, `+ 他${order.items.length - 1}点`];
}

function summarizeItemsForMobile(order: OrderWithRelations) {
  if (order.items.length === 0) return "-";
  if (order.items.length <= 2) {
    return order.items.map((item) => `${item.product_name} x${item.quantity}`).join(" / ");
  }
  const first = order.items[0];
  return `${first.product_name} x${first.quantity} / 他${order.items.length - 1}点`;
}
