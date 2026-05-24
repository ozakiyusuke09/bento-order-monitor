"use client";

import { useEffect, useState } from "react";
import { productChoices } from "@/lib/constants";
import { getProducts, subscribeToProductChanges } from "@/lib/product-store";
import type { Product } from "@/lib/types";

function fallbackProducts(): Product[] {
  const now = new Date().toISOString();
  return productChoices.map((name, index) => ({
    id: `fallback-product-${index + 1}`,
    name,
    price: null,
    is_active: true,
    display_order: index + 1,
    created_at: now
  }));
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const nextProducts = await getProducts();
      setProducts(nextProducts.length ? nextProducts : fallbackProducts());
      setError(null);
    } catch (caught) {
      console.error(caught);
      setProducts(fallbackProducts());
      setError(caught instanceof Error ? caught.message : "商品メニューの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return subscribeToProductChanges(load);
  }, []);

  return {
    products,
    activeProducts: products.filter((product) => product.is_active),
    loading,
    error,
    reload: load
  };
}
