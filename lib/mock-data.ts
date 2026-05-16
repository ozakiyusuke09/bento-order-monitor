import type { OrderAttachment, OrderItem, OrderStatus, OrderWithRelations, StatusLog } from "@/lib/types";
import { todayString } from "@/lib/date";

const now = new Date().toISOString();
const today = todayString();

export const mockOrders: OrderWithRelations[] = [
  {
    id: "demo-001",
    status: "new",
    customer_name: "山田商事",
    phone: "03-0000-1111",
    pickup_date: today,
    pickup_time: "10:30",
    receive_type: "delivery",
    delivery_address: "東京都千代田区丸の内1-1-1",
    payment_method: "invoice",
    note: "領収書あり。受付で担当者へ連絡。",
    source: "manual",
    created_by: null,
    deleted_at: null,
    deleted_by: null,
    created_at: now,
    updated_at: now,
    items: [
      item("demo-001", "唐揚げ弁当", 12, "normal"),
      item("demo-001", "お茶", 12, "none")
    ],
    attachments: [attachment("demo-001", "注文書サンプル.jpg", "mock/order-sheet.jpg", "image/jpeg")],
    status_logs: [log("demo-001", null, "new")]
  },
  {
    id: "demo-002",
    status: "confirmed",
    customer_name: "田中様",
    phone: "090-1234-5678",
    pickup_date: today,
    pickup_time: "11:00",
    receive_type: "pickup",
    delivery_address: null,
    payment_method: "cash",
    note: "ご飯少なめ1つ",
    source: "phone",
    created_by: null,
    deleted_at: null,
    deleted_by: null,
    created_at: now,
    updated_at: now,
    items: [item("demo-002", "日替わり弁当", 3, "small")],
    attachments: [],
    status_logs: [log("demo-002", null, "new"), log("demo-002", "new", "confirmed")]
  },
  {
    id: "demo-003",
    status: "cooking",
    customer_name: "株式会社ABC",
    phone: "03-2222-3333",
    pickup_date: today,
    pickup_time: "11:30",
    receive_type: "delivery",
    delivery_address: "東京都港区芝公園4-2-8",
    payment_method: "invoice",
    note: "搬入口から納品",
    source: "email",
    created_by: null,
    deleted_at: null,
    deleted_by: null,
    created_at: now,
    updated_at: now,
    items: [item("demo-003", "唐揚げ弁当", 20, "normal"), item("demo-003", "のり弁", 10, "large")],
    attachments: [],
    status_logs: [log("demo-003", null, "new"), log("demo-003", "new", "confirmed"), log("demo-003", "confirmed", "cooking")]
  },
  {
    id: "demo-004",
    status: "completed",
    customer_name: "佐藤工務店",
    phone: "045-111-2222",
    pickup_date: today,
    pickup_time: "12:00",
    receive_type: "pickup",
    delivery_address: null,
    payment_method: "cashless",
    note: null,
    source: "manual",
    created_by: null,
    deleted_at: null,
    deleted_by: null,
    created_at: now,
    updated_at: now,
    items: [item("demo-004", "幕の内弁当", 18, "normal")],
    attachments: [],
    status_logs: [log("demo-004", null, "new"), log("demo-004", "cooking", "completed")]
  }
];

function item(orderId: string, productName: string, quantity: number, riceOption: string): OrderItem {
  return {
    id: cryptoRandomId(),
    order_id: orderId,
    product_name: productName,
    quantity,
    rice_option: riceOption,
    note: null,
    created_at: now
  };
}

function log(orderId: string, oldStatus: OrderStatus | null, newStatus: OrderStatus): StatusLog {
  return {
    id: cryptoRandomId(),
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: null,
    note: null,
    created_at: now
  };
}

function attachment(orderId: string, fileName: string, filePath: string, fileType: string): OrderAttachment {
  return {
    id: cryptoRandomId(),
    order_id: orderId,
    file_name: fileName,
    file_path: filePath,
    file_type: fileType,
    file_size: 240000,
    source: "manual",
    uploaded_by: null,
    created_at: now
  };
}

export function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
