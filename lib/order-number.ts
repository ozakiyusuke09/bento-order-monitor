import type { Order } from "@/lib/types";

export function formatOrderNumber(pickupDate: string, sequence: number) {
  return `${pickupDate.replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`;
}

export function displayOrderNumber(order: Pick<Order, "id" | "order_no">) {
  return order.order_no ?? order.id.slice(0, 8);
}

export function displayShortOrderNumber(order: Pick<Order, "id" | "order_no">) {
  if (!order.order_no) return `No.${order.id.slice(0, 4)}`;
  const sequence = order.order_no.split("-").at(-1) ?? order.order_no;
  return `No.${sequence}`;
}
