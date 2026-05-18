"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { productChoices, riceOptionLabels } from "@/lib/constants";
import type { RiceOption } from "@/lib/types";

export type OrderItemFormValue = {
  product_name: string;
  quantity: string;
  rice_option: RiceOption;
  note: string;
};

export const blankOrderItem: OrderItemFormValue = {
  product_name: "唐揚げ弁当",
  quantity: "1",
  rice_option: "normal",
  note: ""
};

export function OrderItemsEditor({
  items,
  onItemsChange,
  saving,
  submitLabel,
  savingLabel
}: {
  items: OrderItemFormValue[];
  onItemsChange: (items: OrderItemFormValue[]) => void;
  saving: boolean;
  submitLabel: string;
  savingLabel: string;
}) {
  const totalQuantity = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    return Number.isFinite(quantity) && quantity > 0 ? sum + quantity : sum;
  }, 0);

  function addItem(productName = "") {
    onItemsChange([...items, { ...blankOrderItem, product_name: productName || blankOrderItem.product_name }]);
  }

  function updateItem(index: number, patch: Partial<OrderItemFormValue>) {
    onItemsChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onItemsChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function stepQuantity(index: number, delta: number) {
    const current = Number(items[index]?.quantity);
    const next = Math.max(1, (Number.isFinite(current) ? current : 0) + delta);
    updateItem(index, { quantity: String(next) });
  }

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">商品</h2>
            <div className="mt-1 text-sm font-bold text-slate-500">商品合計 {totalQuantity}個</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {productChoices.slice(0, 6).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addItem(name)}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              + {name}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-500">商品 {index + 1}</div>
                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="商品を削除"
                    title="商品を削除"
                    onClick={() => removeItem(index)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px]">
                <label>
                  <span className="text-sm font-bold text-slate-700">商品名</span>
                  <input
                    list="products"
                    value={item.product_name}
                    onChange={(event) => updateItem(index, { product_name: event.target.value })}
                    className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                  />
                </label>

                <div>
                  <span className="text-sm font-bold text-slate-700">数量</span>
                  <div className="mt-1 grid h-12 grid-cols-[44px_1fr_44px] overflow-hidden rounded-md border border-slate-300">
                    <button type="button" onClick={() => stepQuantity(index, -1)} className="grid place-items-center border-r border-slate-300 bg-slate-50">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      className="w-full text-center text-lg font-black outline-none"
                    />
                    <button type="button" onClick={() => stepQuantity(index, 1)} className="grid place-items-center border-l border-slate-300 bg-slate-50">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

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
              </div>

              <label className="mt-3 block">
                <span className="text-sm font-bold text-slate-700">商品メモ</span>
                <input
                  value={item.note}
                  onChange={(event) => updateItem(index, { note: event.target.value })}
                  placeholder="ご飯少なめ、ソース別添えなど"
                  className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3"
                />
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addItem()}
          className="mt-4 hidden min-h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 sm:inline-flex"
        >
          <Plus className="h-5 w-5" />
          商品を追加
        </button>
      </section>

      <div className="fixed inset-x-0 bottom-[65px] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-4xl grid-cols-[1fr_1fr] gap-2">
          <button
            type="button"
            onClick={() => addItem()}
            className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-800"
          >
            + 商品を追加
          </button>
          <button type="submit" disabled={saving} className="min-h-12 rounded-md bg-slate-950 px-3 text-sm font-black text-white disabled:opacity-60">
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
        <div className="mt-2 text-center text-xs font-black text-slate-500">商品合計 {totalQuantity}個</div>
      </div>

      <datalist id="products">
        {productChoices.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
