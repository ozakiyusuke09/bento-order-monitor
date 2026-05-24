"use client";

import { productChoices } from "@/lib/constants";
import { cryptoRandomId } from "@/lib/mock-data";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const STORAGE_KEY = "bento-order-monitor.mock-products";
const CHANNEL_NAME = "bento-order-monitor.products";

export type ProductInput = {
  name: string;
  display_order: number;
  is_active: boolean;
};

function productSort(a: Product, b: Product) {
  const order = a.display_order - b.display_order;
  if (order !== 0) return order;
  return a.name.localeCompare(b.name, "ja");
}

function defaultProducts(): Product[] {
  const now = new Date().toISOString();
  return productChoices.map((name, index) => ({
    id: `default-product-${index + 1}`,
    name,
    price: null,
    is_active: true,
    display_order: index + 1,
    created_at: now
  }));
}

function readMockProducts() {
  if (typeof window === "undefined") return defaultProducts();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const products = defaultProducts();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return products;
  }
  return JSON.parse(stored) as Product[];
}

function writeMockProducts(products: Product[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent(CHANNEL_NAME));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "changed" });
    channel.close();
  }
}

export function subscribeToProductChanges(onChange: () => void) {
  if (hasSupabaseEnv && supabase) {
    const client = supabase;
    const channel = client
      .channel("product-master-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, onChange)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  const listener = () => onChange();
  window.addEventListener(CHANNEL_NAME, listener);
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  channel?.addEventListener("message", listener);

  return () => {
    window.removeEventListener(CHANNEL_NAME, listener);
    channel?.close();
  };
}

export async function getProducts() {
  if (hasSupabaseEnv && supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,is_active,display_order,created_at")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((product) => ({
      ...product,
      price: product.price ?? null,
      display_order: product.display_order ?? 0
    })) as Product[];
  }

  return readMockProducts().sort(productSort);
}

export async function createProduct(input: ProductInput) {
  const name = input.name.trim();
  if (!name) throw new Error("商品名を入力してください。");

  if (hasSupabaseEnv && supabase) {
    const { error } = await supabase.from("products").insert({
      name,
      price: null,
      display_order: input.display_order,
      is_active: input.is_active
    });
    if (error) throw error;
    return;
  }

  const now = new Date().toISOString();
  writeMockProducts([
    ...readMockProducts(),
    {
      id: cryptoRandomId(),
      name,
      price: null,
      display_order: input.display_order,
      is_active: input.is_active,
      created_at: now
    }
  ]);
}

export async function updateProduct(id: string, input: ProductInput) {
  const name = input.name.trim();
  if (!name) throw new Error("商品名を入力してください。");

  if (hasSupabaseEnv && supabase) {
    const { error } = await supabase
      .from("products")
      .update({
        name,
        display_order: input.display_order,
        is_active: input.is_active
      })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  writeMockProducts(
    readMockProducts().map((product) =>
      product.id === id
        ? {
            ...product,
            name,
            display_order: input.display_order,
            is_active: input.is_active
          }
        : product
    )
  );
}

export async function seedInitialProducts() {
  const existing = await getProducts();
  const existingNames = new Set(existing.map((product) => product.name));
  const missing = productChoices.filter((name) => !existingNames.has(name));
  if (!missing.length) return 0;

  if (hasSupabaseEnv && supabase) {
    const maxOrder = existing.reduce((max, product) => Math.max(max, product.display_order), 0);
    const { error } = await supabase.from("products").insert(
      missing.map((name, index) => ({
        name,
        price: null,
        is_active: true,
        display_order: maxOrder + index + 1
      }))
    );
    if (error) throw error;
    return missing.length;
  }

  const now = new Date().toISOString();
  const maxOrder = existing.reduce((max, product) => Math.max(max, product.display_order), 0);
  writeMockProducts([
    ...existing,
    ...missing.map((name, index) => ({
      id: cryptoRandomId(),
      name,
      price: null,
      is_active: true,
      display_order: maxOrder + index + 1,
      created_at: now
    }))
  ]);
  return missing.length;
}
