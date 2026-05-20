"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, CreditCard, MapPin, Phone, StickyNote, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { blankOrderItem, OrderItemsEditor, type OrderItemFormValue } from "@/components/order-items-editor";
import { createOrder } from "@/lib/order-store";
import { todayString } from "@/lib/date";
import type { CreateOrderInput } from "@/lib/types";

export default function NewOrderPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState(todayString());
  const [pickupTime, setPickupTime] = useState("11:00");
  const [receiveType, setReceiveType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<OrderItemFormValue[]>([{ ...blankOrderItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!customerName.trim()) throw new Error("注文者名を入力してください。");
      if (!pickupDate) throw new Error("受取日を入力してください。");
      if (!pickupTime) throw new Error("受取時間を入力してください。");
      const normalizedItems = items
        .filter((item) => item.product_name.trim())
        .map((item) => ({
          product_name: item.product_name.trim(),
          quantity: Number(item.quantity),
          rice_option: item.rice_option,
          note: item.note.trim() || null
        }));

      if (!normalizedItems.length) throw new Error("商品を1つ以上入力してください。");
      if (normalizedItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
        throw new Error("商品の数量は1以上で入力してください。");
      }

      const payload: CreateOrderInput = {
        order: {
          customer_name: customerName.trim(),
          phone: phone.trim() || null,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          receive_type: receiveType,
          delivery_address: receiveType === "delivery" ? deliveryAddress.trim() || null : null,
          payment_method: paymentMethod,
          note: note.trim() || null
        },
        items: normalizedItems
      };

      await createOrder(payload);
      router.push(`/orders?date=${pickupDate}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-[1120px] px-4 pb-44 pt-3 sm:px-6 sm:pb-10 lg:px-8 lg:pt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-500">新規注文</div>
              <h1 className="text-2xl font-black leading-tight tracking-normal text-slate-950 sm:text-3xl">注文登録</h1>
            </div>
            <div className="hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:block">
              {pickupDate} {pickupTime}
            </div>
          </div>

          <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
                <h2 className="text-sm font-black text-slate-600">基本情報</h2>
              </div>
              <div className="grid gap-x-3 gap-y-3 p-4 sm:grid-cols-2">
                <Input icon={<UserRound className="h-4 w-4" />} label="注文者名" value={customerName} onChange={setCustomerName} required />
                <Input icon={<Phone className="h-4 w-4" />} label="電話番号" value={phone} onChange={setPhone} />
                <Input icon={<CalendarDays className="h-4 w-4" />} label="受取日" type="date" value={pickupDate} onChange={setPickupDate} required />
                <Input icon={<Clock className="h-4 w-4" />} label="受取時間" type="time" value={pickupTime} onChange={setPickupTime} required />
                <div>
                  <span className="mb-1.5 block text-xs font-black text-slate-500">受取方法</span>
                  <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setReceiveType("pickup")}
                      className={
                        receiveType === "pickup"
                          ? "h-10 rounded bg-slate-950 text-sm font-black text-white"
                          : "h-10 rounded text-sm font-black text-slate-700 hover:bg-white"
                      }
                    >
                      店頭
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiveType("delivery")}
                      className={
                        receiveType === "delivery"
                          ? "h-10 rounded bg-slate-950 text-sm font-black text-white"
                          : "h-10 rounded text-sm font-black text-slate-700 hover:bg-white"
                      }
                    >
                      配達
                    </button>
                  </div>
                </div>
                <Select
                  icon={<CreditCard className="h-4 w-4" />}
                  label="支払い方法"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: "cash", label: "現金" },
                    { value: "invoice", label: "請求" },
                    { value: "cashless", label: "キャッシュレス" },
                    { value: "other", label: "その他" }
                  ]}
                />
              </div>
              {receiveType === "delivery" ? (
                <div className="border-t border-slate-100 px-4 pb-4 pt-4">
                  <Input icon={<MapPin className="h-4 w-4" />} label="配達先（任意）" value={deliveryAddress} onChange={setDeliveryAddress} />
                </div>
              ) : null}
              <div className="border-t border-slate-100 p-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-500">
                    <StickyNote className="h-4 w-4" />
                    備考
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
                <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                  添付は登録後の詳細画面から追加できます。
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <OrderItemsEditor items={items} onItemsChange={setItems} saving={saving} submitLabel="注文を登録" savingLabel="登録中..." />

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 font-bold text-red-700" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="hidden h-12 w-full rounded-md bg-slate-950 px-5 text-base font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 sm:block"
              >
                {saving ? "登録中..." : "注文を登録"}
              </button>
            </div>
          </form>
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function Input({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-500">
        {icon}
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
      />
    </label>
  );
}

function Select({
  icon,
  label,
  value,
  onChange,
  options
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-500">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
