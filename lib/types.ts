export type OrderStatus = "new" | "confirmed" | "cooking" | "completed" | "cancelled";
export type ReceiveType = "pickup" | "delivery";
export type RiceOption = "normal" | "large" | "small" | "none";
export type PaymentMethod = "cash" | "invoice" | "cashless" | "other";
export type OrderSource = "manual" | "web" | "line" | "email" | "phone";

export type Order = {
  id: string;
  order_no: string | null;
  daily_sequence: number | null;
  status: OrderStatus;
  customer_name: string;
  phone: string | null;
  pickup_date: string;
  pickup_time: string;
  receive_type: ReceiveType;
  delivery_address: string | null;
  payment_method: PaymentMethod | string;
  note: string | null;
  source: OrderSource | string;
  created_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  rice_option: RiceOption | string;
  note: string | null;
  created_at: string;
};

export type StatusLog = {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

export type OrderAttachment = {
  id: string;
  order_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  source: OrderSource | string;
  uploaded_by: string | null;
  created_at: string;
};

export type OrderWithRelations = Order & {
  items: OrderItem[];
  attachments: OrderAttachment[];
  status_logs: StatusLog[];
};

export type CreateOrderInput = {
  order: Omit<
    Order,
    | "id"
    | "order_no"
    | "daily_sequence"
    | "status"
    | "deleted_at"
    | "deleted_by"
    | "created_at"
    | "updated_at"
    | "created_by"
    | "source"
  > & {
    status?: OrderStatus;
    source?: OrderSource;
  };
  items: Array<Pick<OrderItem, "product_name" | "quantity" | "rice_option" | "note">>;
};

export type UpdateOrderInput = {
  order: Pick<
    Order,
    | "customer_name"
    | "phone"
    | "pickup_date"
    | "pickup_time"
    | "receive_type"
    | "delivery_address"
    | "payment_method"
    | "note"
  >;
  items: Array<Pick<OrderItem, "product_name" | "quantity" | "rice_option" | "note">>;
};

export type DashboardStats = {
  statusCounts: Record<OrderStatus, number>;
  productTotals: Array<{ product_name: string; quantity: number }>;
  totalItems: number;
  attachmentCount: number;
  pickupCount: number;
  deliveryCount: number;
};
