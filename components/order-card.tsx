import Link from "next/link";
import { FileImage, MapPin, MessageSquare, Phone } from "lucide-react";
import { displayTime, isPickupSoon } from "@/lib/date";
import { receiveTypeLabels, riceOptionLabels } from "@/lib/constants";
import type { OrderWithRelations } from "@/lib/types";
import { StatusActions } from "@/components/status-actions";
import { StatusBadge } from "@/components/status-badge";

export function OrderCard({ order, onChanged }: { order: OrderWithRelations; onChanged?: () => void }) {
  const soon = isPickupSoon(order.pickup_date, order.pickup_time) && order.status !== "completed";

  return (
    <article className={`rounded-lg border bg-white p-4 shadow-soft ${soon ? "border-red-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <div className="text-lg font-black text-slate-950">{displayTime(order.pickup_time)}</div>
        <div className={order.receive_type === "delivery" ? "rounded-md bg-violet-100 px-2 py-1 text-sm font-bold text-violet-800" : "rounded-md bg-slate-100 px-2 py-1 text-sm font-bold text-slate-700"}>
          {receiveTypeLabels[order.receive_type]}
        </div>
        {soon ? <div className="rounded-md bg-red-600 px-2 py-1 text-sm font-bold text-white">時間注意</div> : null}
      </div>

      <div className="mt-3">
        <Link href={`/orders/${order.id}`} className="text-xl font-black text-slate-950 hover:underline">
          {order.customer_name}
        </Link>
        {order.phone ? (
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <Phone className="h-4 w-4" />
            {order.phone}
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
            <div>
              <div className="font-bold text-slate-900">{item.product_name}</div>
              <div className="text-xs text-slate-500">ご飯：{riceOptionLabels[item.rice_option as keyof typeof riceOptionLabels] ?? item.rice_option}</div>
            </div>
            <div className="whitespace-nowrap text-lg font-black text-slate-950">x{item.quantity}</div>
          </div>
        ))}
      </div>

      {order.delivery_address ? (
        <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <span>{order.delivery_address}</span>
        </div>
      ) : null}
      {order.note ? (
        <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>備考：{order.note}</span>
        </div>
      ) : null}
      {order.attachments.length > 0 ? (
        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
          <FileImage className="h-4 w-4 text-slate-400" />
          添付あり {order.attachments.length}件
        </div>
      ) : null}

      <div className="mt-4">
        <StatusActions order={order} onChanged={onChanged} />
      </div>
      <Link
        href={`/orders/${order.id}`}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-bold text-white"
      >
        詳細を見る
      </Link>
    </article>
  );
}
