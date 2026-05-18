"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { createOrder } from "@/lib/order-store";
import { productChoices, riceOptionLabels } from "@/lib/constants";
import { todayString } from "@/lib/date";
import type { CreateOrderInput, RiceOption } from "@/lib/types";

type FormItem = {
  product_name: string;
  quantity: string;
  rice_option: RiceOption;
  note: string;
};

const blankItem: FormItem = {
  product_name: "唐揚げ弁当",
  quantity: "1",
  rice_option: "normal",
  note: ""
};

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
  const [items, setItems] = useState<FormItem[]>([{ ...blankItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<FormItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!customerName.trim()) throw new Error("注文者名を入力してください。");
      if (!pickupDate) throw new Error("受取日を入力してください。");
      if (!pickupTime) throw new Error("受取時間を入力してください。");
      if (receiveType === "delivery" && !deliveryAddress.trim()) {
        throw new Error("配達の場合は配達先を入力してください。");
      }

      const normalizedItems = items
        .filter((item) => item.product_name.trim())
        .map((item) => ({
          product_name: item.product_name.trim(),
          quantity: Number(item.quantity),
          rice_option: item.rice_option,
          note: item.note || null
        }));

      if (!normalizedItems.length) throw new Error("商品を1つ以上入力してください。");
      if (normalizedItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
        throw new Error("商品の数量は1以上で入力してください。");
      }

      const payload: CreateOrderInput = {
        order: {
          customer_name: customerName.trim(),
          phone: phone || null,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          receive_type: receiveType,
          delivery_address: receiveType === "delivery" ? deliveryAddress.trim() : null,
          payment_method: paymentMethod,
          note: note || null
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
        <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:pb-10">
          <div className="mb-5">
            <div className="text-sm font-bold text-slate-500">電話・LINE・メール注文を手入力</div>
            <h1 className="text-3xl font-black text-slate-950">注文登録</h1>
          </div>

          <form onSubmit={submit} noValidate className="space-y-5">
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
                    <option value="pickup">店頭</option>
                    <option value="delivery">配達</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-700">支払い方法</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                  >
                    <option value="cash">現金</option>
                    <option value="invoice">請求</option>
                    <option value="cashless">キャッシュレス</option>
                    <option value="other">その他</option>
                  </select>
                </label>
              </div>
              {receiveType === "delivery" ? (
                <div className="mt-4">
                  <Input label="配達先" value={deliveryAddress} onChange={setDeliveryAddress} />
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
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                画像・ファイル添付は登録後の注文詳細画面から追加できます。
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-950">商品</h2>
                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, { ...blankItem }])}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_100px_130px_auto]">
                    <label>
                      <span className="text-sm font-bold text-slate-700">商品名</span>
                      <input
                        list="products"
                        value={item.product_name}
                        onChange={(event) => updateItem(index, { product_name: event.target.value })}
                        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                      />
                    </label>
                    <label>
                      <span className="text-sm font-bold text-slate-700">数量</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: event.target.value })}
                        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                      />
                    </label>
                    <label>
                      <span className="text-sm font-bold text-slate-700">ご飯量</span>
                      <select
                        value={item.rice_option}
                        onChange={(event) => updateItem(index, { rice_option: event.target.value as RiceOption })}
                        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                      >
                        {Object.entries(riceOptionLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      aria-label="商品を削除"
                      title="商品を削除"
                      onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="mt-6 h-12 rounded-md border border-slate-200 px-3 text-slate-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <label className="sm:col-span-4">
                      <span className="text-sm font-bold text-slate-700">商品メモ</span>
                      <input
                        value={item.note}
                        onChange={(event) => updateItem(index, { note: event.target.value })}
                        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <datalist id="products">
              {productChoices.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 font-bold text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="h-14 w-full rounded-md bg-slate-950 px-5 text-lg font-black text-white disabled:opacity-60"
            >
              {saving ? "登録中..." : "注文を登録"}
            </button>
          </form>
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
