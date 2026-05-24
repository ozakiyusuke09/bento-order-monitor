"use client";

import { useMemo, useState } from "react";
import { Check, PackagePlus, Save } from "lucide-react";
import { createProduct, seedInitialProducts, updateProduct } from "@/lib/product-store";
import { useProducts } from "@/hooks/use-products";

export function ProductManagement() {
  const { products, loading, error, reload } = useProducts();
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nextOrder = useMemo(() => {
    return products.reduce((max, product) => Math.max(max, product.display_order), 0) + 1;
  }, [products]);

  async function addProduct() {
    setSaving(true);
    setMessage(null);
    try {
      await createProduct({
        name,
        display_order: Number(displayOrder) || nextOrder,
        is_active: true
      });
      setName("");
      setDisplayOrder("");
      setMessage("商品を登録しました。");
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "商品の登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function addInitialProducts() {
    setSaving(true);
    setMessage(null);
    try {
      const count = await seedInitialProducts();
      setMessage(count ? `初期商品を${count}件追加しました。` : "初期商品はすでに登録済みです。");
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "初期商品の登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">商品管理</h2>
        </div>
        <button
          type="button"
          onClick={addInitialProducts}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <PackagePlus className="h-4 w-4" />
          初期商品を追加
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_120px]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="商品名"
          className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-slate-400"
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          placeholder={`${nextOrder}`}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={addProduct}
          disabled={saving || !name.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-black text-white disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          登録
        </button>
      </div>

      {message ? <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{message}</div> : null}
      {error ? <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">{error}</div> : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[1fr_92px_90px_86px] gap-2 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
          <div>商品名</div>
          <div>表示順</div>
          <div>状態</div>
          <div />
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-3 py-5 text-sm font-bold text-slate-500">読み込み中...</div>
          ) : products.length ? (
            products.map((product) => <ProductRow key={product.id} product={product} onSaved={reload} />)
          ) : (
            <div className="px-3 py-5 text-sm font-bold text-slate-500">商品がまだありません。</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductRow({
  product,
  onSaved
}: {
  product: { id: string; name: string; display_order: number; is_active: boolean };
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [displayOrder, setDisplayOrder] = useState(String(product.display_order));
  const [isActive, setIsActive] = useState(product.is_active);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name,
        display_order: Number(displayOrder) || 0,
        is_active: isActive
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_92px_90px_86px] gap-2 px-3 py-2">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="h-9 min-w-0 rounded-md border border-slate-200 px-2 text-sm font-semibold outline-none focus:border-slate-400"
      />
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={displayOrder}
        onChange={(event) => setDisplayOrder(event.target.value)}
        className="h-9 rounded-md border border-slate-200 px-2 text-sm font-semibold outline-none focus:border-slate-400"
      />
      <button
        type="button"
        onClick={() => setIsActive((current) => !current)}
        className={
          isActive
            ? "h-9 rounded-md border border-green-200 bg-green-50 text-xs font-black text-green-700"
            : "h-9 rounded-md border border-slate-200 bg-slate-50 text-xs font-black text-slate-500"
        }
      >
        {isActive ? "有効" : "無効"}
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saving || !name.trim()}
        aria-label="保存"
        title="保存"
        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
      </button>
    </div>
  );
}
