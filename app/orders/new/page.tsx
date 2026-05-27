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

          <form onSubmit={submit} noValidate className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-4">
            <div className="space-y-3">
              <FormCard icon={<UserRound className="h-5 w-5" />} title="お客様情報">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Input label="注文者名" value={customerName} onChange={setCustomerName} required />
                  <Input icon={<Phone className="h-4 w-4" />} label="電話番号" value={phone} onChange={setPhone} />
                </div>
              </FormCard>

              <FormCard icon={<CalendarDays className="h-5 w-5" />} title="受取日時">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Input label="受取日" type="date" value={pickupDate} onChange={setPickupDate} required />
                  <Input icon={<Clock className="h-4 w-4" />} label="受取時間" type="time" value={pickupTime} onChange={setPickupTime} required />
                </div>
              </FormCard>

              <div className="lg:hidden">
                <OrderItemsEditor items={items} onItemsChange={setItems} saving={saving} submitLabel="注文を登録" savingLabel="登録中..." />
              </div>

              <FormCard icon={<MapPin className="h-5 w-5" />} title="受取方法">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <span className="mb-1.5 block text-xs font-black text-slate-500">受取方法</span>
                    <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setReceiveType("pickup")}
                        className={
                          receiveType === "pickup"
                            ? "h-9 rounded bg-slate-950 text-sm font-black text-white sm:h-10"
                            : "h-9 rounded text-sm font-black text-slate-700 hover:bg-white sm:h-10"
                        }
                      >
                        店頭
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiveType("delivery")}
                        className={
                          receiveType === "delivery"
                            ? "h-9 rounded bg-slate-950 text-sm font-black text-white sm:h-10"
                            : "h-9 rounded text-sm font-black text-slate-700 hover:bg-white sm:h-10"
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
                  {receiveType === "delivery" ? (
                    <div className="col-span-2">
                      <Input icon={<MapPin className="h-4 w-4" />} label="配達先（任意）" value={deliveryAddress} onChange={setDeliveryAddress} />
                    </div>
                  ) : null}
                </div>
              </FormCard>

              <FormCard icon={<StickyNote className="h-5 w-5" />} title="備考">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="例：唐揚げソース別、幕の内ご飯少なめ、領収書あり"
                  rows={2}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                />
              </FormCard>
            </div>

            <div className="space-y-4">
              <div className="hidden lg:block">
                <OrderItemsEditor items={items} onItemsChange={setItems} saving={saving} submitLabel="注文を登録" savingLabel="登録中..." />
              </div>

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

function FormCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-600 sm:mb-3">
        <span className="text-slate-500">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
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
      <span className="mb-1 flex items-center gap-1 text-[11px] font-black text-slate-500 sm:mb-1.5 sm:gap-1.5 sm:text-xs">
        {icon}
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 sm:h-10 sm:px-3"
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
      <span className="mb-1 flex items-center gap-1 text-[11px] font-black text-slate-500 sm:mb-1.5 sm:gap-1.5 sm:text-xs">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 sm:h-10 sm:px-3"
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
