"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { productChoices } from "@/lib/constants";
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
  const { products, activeProducts } = useProducts();
  const productNames = products.length ? activeProducts.map((product) => product.name) : productChoices;
  const totalQuantity = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    return Number.isFinite(quantity) && quantity > 0 ? sum + quantity : sum;
  }, 0);

  function addItem(productName = "") {
    onItemsChange([...items, { ...blankOrderItem, product_name: productName || productNames[0] || blankOrderItem.product_name }]);
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
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
          <h2 className="text-sm font-black text-slate-600">商品</h2>
          <div className="text-sm font-black text-slate-800">合計 {totalQuantity}個</div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-3">
          {productNames.slice(0, 6).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addItem(name)}
              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-800 shadow-[0_1px_1px_rgba(15,23,42,0.03)] hover:bg-slate-50"
            >
              + {name}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">商品 {index + 1}</div>
                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="商品を削除"
                    title="商品を削除"
                    onClick={() => removeItem(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_128px]">
                <ProductNameField
                  value={item.product_name}
                  productNames={productNames}
                  onChange={(productName) => updateItem(index, { product_name: productName })}
                />

                <div>
                  <span className="mb-1.5 block text-xs font-black text-slate-500">数量</span>
                  <div className="grid h-10 grid-cols-[38px_1fr_38px] overflow-hidden rounded-md border border-slate-200">
                    <button type="button" onClick={() => stepQuantity(index, -1)} className="grid place-items-center border-r border-slate-200 bg-slate-50">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      className="w-full text-center text-base font-black outline-none"
                    />
                    <button type="button" onClick={() => stepQuantity(index, 1)} className="grid place-items-center border-l border-slate-200 bg-slate-50">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addItem()}
          className="hidden h-11 w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 sm:inline-flex"
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
    </>
  );
}

function ProductNameField({
  value,
  productNames,
  onChange
}: {
  value: string;
  productNames: string[];
  onChange: (value: string) => void;
}) {
  const isKnownProduct = productNames.includes(value);
  const selectValue = isKnownProduct ? value : "__custom__";

  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-slate-500">商品名</span>
      <select
        value={selectValue}
        onChange={(event) => {
          if (event.target.value === "__custom__") {
            onChange(isKnownProduct ? "" : value);
            return;
          }
          onChange(event.target.value);
        }}
        className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
      >
        {productNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value="__custom__">その他（自由入力）</option>
      </select>
      {selectValue === "__custom__" ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="臨時メニュー名"
          className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
        />
      ) : null}
    </label>
  );
}
