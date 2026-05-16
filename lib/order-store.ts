"use client";

import { supabase, hasSupabaseEnv } from "@/lib/supabase";
import { mockOrders, cryptoRandomId } from "@/lib/mock-data";
import { todayString } from "@/lib/date";
import type {
  CreateOrderInput,
  DashboardStats,
  OrderAttachment,
  OrderItem,
  OrderStatus,
  OrderWithRelations,
  StatusLog
} from "@/lib/types";

const STORAGE_KEY = "bento-order-monitor.mock-orders";
const CHANNEL_NAME = "bento-order-monitor.orders";

function orderByPickup(a: OrderWithRelations, b: OrderWithRelations) {
  return `${a.pickup_date} ${a.pickup_time}`.localeCompare(`${b.pickup_date} ${b.pickup_time}`);
}

function normalizeOrder(row: any): OrderWithRelations {
  return {
    ...row,
    deleted_at: row.deleted_at ?? null,
    deleted_by: row.deleted_by ?? null,
    items: row.order_items ?? row.items ?? [],
    attachments: row.order_attachments ?? row.attachments ?? [],
    status_logs: row.status_logs ?? []
  };
}

function readMockOrders() {
  if (typeof window === "undefined") return mockOrders;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOrders));
    return mockOrders;
  }
  return JSON.parse(stored) as OrderWithRelations[];
}

function writeMockOrders(orders: OrderWithRelations[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(CHANNEL_NAME));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "changed" });
    channel.close();
  }
}

export function subscribeToOrderChanges(onChange: () => void) {
  if (hasSupabaseEnv && supabase) {
    const client = supabase;
    const channel = client
      .channel("order-monitor-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "status_logs" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_attachments" }, onChange)
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

export async function getTodayOrders(date = todayString()) {
  return getOrdersByDate(date);
}

export async function getOrdersByDate(date: string) {
  if (hasSupabaseEnv && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_attachments(*), status_logs(*)")
      .eq("pickup_date", date)
      .is("deleted_at", null)
      .order("pickup_time", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeOrder).sort(orderByPickup);
  }

  return readMockOrders()
    .filter((order) => order.pickup_date === date && !order.deleted_at)
    .sort(orderByPickup);
}

export async function getFutureOrders(fromDate = todayString()) {
  if (hasSupabaseEnv && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_attachments(*), status_logs(*)")
      .gt("pickup_date", fromDate)
      .is("deleted_at", null)
      .order("pickup_date", { ascending: true })
      .order("pickup_time", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeOrder).sort(orderByPickup);
  }

  return readMockOrders()
    .filter((order) => order.pickup_date > fromDate && !order.deleted_at)
    .sort(orderByPickup);
}

export async function getPastOrders(beforeDate = todayString()) {
  if (hasSupabaseEnv && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_attachments(*), status_logs(*)")
      .or(`pickup_date.lt.${beforeDate},deleted_at.not.is.null`)
      .order("pickup_date", { ascending: false })
      .order("pickup_time", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeOrder).sort(orderByPickup);
  }

  return readMockOrders()
    .filter((order) => order.pickup_date < beforeDate || Boolean(order.deleted_at))
    .sort(orderByPickup);
}

export async function getOrder(id: string) {
  if (hasSupabaseEnv && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_attachments(*), status_logs(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return normalizeOrder(data);
  }

  return readMockOrders().find((order) => order.id === id) ?? null;
}

export async function createOrder(input: CreateOrderInput) {
  const status = input.order.status ?? "new";
  const source = input.order.source ?? "manual";

  if (hasSupabaseEnv && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const createdBy = userData.user?.id ?? null;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...input.order,
        status,
        source,
        created_by: createdBy
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const items = input.items.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) throw itemsError;

    await supabase.from("status_logs").insert({
      order_id: order.id,
      old_status: null,
      new_status: status,
      changed_by: createdBy,
      note: "注文登録"
    });

    return order.id as string;
  }

  const now = new Date().toISOString();
  const id = cryptoRandomId();
  const order: OrderWithRelations = {
    id,
    status,
    source,
    created_by: null,
    deleted_at: null,
    deleted_by: null,
    created_at: now,
    updated_at: now,
    ...input.order,
    items: input.items.map<OrderItem>((item) => ({
      id: cryptoRandomId(),
      order_id: id,
      product_name: item.product_name,
      quantity: item.quantity,
      rice_option: item.rice_option,
      note: item.note,
      created_at: now
    })),
    attachments: [],
    status_logs: [
      {
        id: cryptoRandomId(),
        order_id: id,
        old_status: null,
        new_status: status,
        changed_by: null,
        note: "注文登録",
        created_at: now
      }
    ]
  };

  writeMockOrders([...readMockOrders(), order]);
  return id;
}

export async function softDeleteOrder(order: OrderWithRelations) {
  if (order.deleted_at) return;
  const now = new Date().toISOString();

  if (hasSupabaseEnv && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const changedBy = userData.user?.id ?? null;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ deleted_at: now, deleted_by: changedBy, updated_at: now })
      .eq("id", order.id);
    if (updateError) throw updateError;

    const { error: logError } = await supabase.from("status_logs").insert({
      order_id: order.id,
      old_status: order.status,
      new_status: order.status,
      changed_by: changedBy,
      note: "削除"
    });
    if (logError) throw logError;
    return;
  }

  writeMockOrders(
    readMockOrders().map((current) =>
      current.id === order.id ? { ...current, deleted_at: now, deleted_by: null, updated_at: now } : current
    )
  );
}

export async function updateOrderStatus(order: OrderWithRelations, newStatus: OrderStatus) {
  if (order.status === newStatus) return;

  if (hasSupabaseEnv && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const changedBy = userData.user?.id ?? null;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (updateError) throw updateError;

    const { error: logError } = await supabase.from("status_logs").insert({
      order_id: order.id,
      old_status: order.status,
      new_status: newStatus,
      changed_by: changedBy,
      note: "ステータス変更"
    });
    if (logError) throw logError;
    return;
  }

  const now = new Date().toISOString();
  const orders = readMockOrders().map((current) => {
    if (current.id !== order.id) return current;
    const log: StatusLog = {
      id: cryptoRandomId(),
      order_id: current.id,
      old_status: current.status,
      new_status: newStatus,
      changed_by: null,
      note: "ステータス変更",
      created_at: now
    };
    return {
      ...current,
      status: newStatus,
      updated_at: now,
      status_logs: [...current.status_logs, log]
    };
  });
  writeMockOrders(orders);
}

export async function addAttachment(orderId: string, file: File) {
  const now = new Date().toISOString();

  if (hasSupabaseEnv && supabase) {
    const safeName = file.name.replace(/[^\w.\-ぁ-んァ-ヶ一-龠々ー]/g, "_");
    const filePath = `orders/${orderId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from("order-attachments").upload(filePath, file, {
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data: userData } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("order_attachments").insert({
      order_id: orderId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      source: "manual",
      uploaded_by: userData.user?.id ?? null
    });
    if (insertError) throw insertError;
    return;
  }

  const attachment: OrderAttachment = {
    id: cryptoRandomId(),
    order_id: orderId,
    file_name: file.name,
    file_path: URL.createObjectURL(file),
    file_type: file.type,
    file_size: file.size,
    source: "manual",
    uploaded_by: null,
    created_at: now
  };
  writeMockOrders(
    readMockOrders().map((order) =>
      order.id === orderId ? { ...order, attachments: [...order.attachments, attachment], updated_at: now } : order
    )
  );
}

export function summarizeOrders(orders: OrderWithRelations[]): DashboardStats {
  const activeOrders = orders.filter((order) => !order.deleted_at);
  const statusCounts: DashboardStats["statusCounts"] = {
    new: 0,
    confirmed: 0,
    cooking: 0,
    completed: 0,
    cancelled: 0
  };
  const productMap = new Map<string, number>();
  let attachmentCount = 0;
  let deliveryCount = 0;

  for (const order of activeOrders) {
    statusCounts[order.status] += 1;
    attachmentCount += order.attachments.length;
    if (order.receive_type === "delivery") deliveryCount += 1;
    for (const item of order.items) {
      productMap.set(item.product_name, (productMap.get(item.product_name) ?? 0) + item.quantity);
    }
  }

  const productTotals = Array.from(productMap, ([product_name, quantity]) => ({ product_name, quantity })).sort(
    (a, b) => b.quantity - a.quantity
  );

  return {
    statusCounts,
    productTotals,
    totalItems: productTotals.reduce((sum, item) => sum + item.quantity, 0),
    attachmentCount,
    deliveryCount
  };
}

export function summarizeRemainingOrders(orders: OrderWithRelations[]): DashboardStats {
  return summarizeOrders(
    orders.filter((order) => !order.deleted_at && order.status !== "completed" && order.status !== "cancelled")
  );
}
