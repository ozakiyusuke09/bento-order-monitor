"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { blankOrderItem, OrderItemsEditor, type OrderItemFormValue } from "@/components/order-items-editor";
import { getOrder, updateOrder } from "@/lib/order-store";
import { displayOrderNumber } from "@/lib/order-number";
import { paymentMethodLabels, receiveTypeLabels } from "@/lib/constants";
import type { OrderWithRelations, RiceOption, UpdateOrderInput } from "@/lib/types";

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [receiveType, setReceiveType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<OrderItemFormValue[]>([{ ...blankOrderItem }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setError(null);
      const next = await getOrder(params.id);
      if (!next) {
        setOrder(null);
        return;
      }
      setOrder(next);
      setCustomerName(next.customer_name);
      setPhone(next.phone ?? "");
      setPickupDate(next.pickup_date);
      setPickupTime(next.pickup_time.slice(0, 5));
      setReceiveType(next.receive_type);
      setDeliveryAddress(next.delivery_address ?? "");
      setPaymentMethod(next.payment_method);
      setNote(next.note ?? "");
      setItems(
        next.items.length
          ? next.items.map((item) => ({
              product_name: item.product_name,
              quantity: String(item.quantity),
              rice_option: item.rice_option as RiceOption,
              note: item.note ?? ""
            }))
          : [{ ...blankOrderItem }]
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
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

      const payload: UpdateOrderInput = {
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

      await updateOrder(order, payload);
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-4xl px-4 pb-44 pt-6 sm:pb-10">
          <Link href={`/orders/${params.id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            詳細へ戻る
          </Link>

          {loading ? <div className="text-slate-500">読み込み中...</div> : null}
          {error ? <div className="mb-4 rounded-md bg-red-50 p-4 font-bold text-red-700">{error}</div> : null}
          {!loading && !order ? <div className="rounded-lg bg-white p-6">注文が見つかりません。</div> : null}

          {order ? (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="mb-5">
                <div className="text-sm font-bold text-slate-500">受注番号 {displayOrderNumber(order)}</div>
                <h1 className="text-3xl font-black text-slate-950">注文編集</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">受注番号は受付記録として固定されます。</p>
              </div>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <h2 className="text-xl font-black text-slate-950">基本情報</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="注文者名" value={customerName} onChange={setCustomerName} required />
                  <Input label="電話番号" value={phone} onChange={setPhone} />
                  <Input label="受取日" type="date" value={pickupDate} onChange={setPickupDate} required />
                  <Input label="受取時間" type="time" value={pickupTime} onChange={setPickupTime} required />
                  <label>
                    <span className="text-sm font-bold text-slate-700">受取方法</span>
                    <select
                      value={receiveType}
                      onChange={(event) => setReceiveType(event.target.value as "pickup" | "delivery")}
                      className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                    >
                      {Object.entries(receiveTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-bold text-slate-700">支払い方法</span>
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                    >
                      {Object.entries(paymentMethodLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {receiveType === "delivery" ? (
                  <div className="mt-4">
                    <Input label="配達先（任意）" value={deliveryAddress} onChange={setDeliveryAddress} />
                  </div>
                ) : null}
                <label className="mt-4 block">
                  <span className="text-sm font-bold text-slate-700">備考</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                </label>
              </section>

              <OrderItemsEditor items={items} onItemsChange={setItems} saving={saving} submitLabel="変更を保存" savingLabel="保存中..." />

              <button
                type="submit"
                disabled={saving}
                className="hidden h-14 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-lg font-black text-white disabled:opacity-60 sm:inline-flex"
              >
                <Save className="h-5 w-5" />
                {saving ? "保存中..." : "変更を保存"}
              </button>
            </form>
          ) : null}
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
      />
    </label>
  );
}
