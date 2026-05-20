import type { OrderStatus, PaymentMethod, ReceiveType, RiceOption } from "@/lib/types";

export const statusLabels: Record<OrderStatus, string> = {
  new: "新規",
  confirmed: "確認済み",
  cooking: "調理完了",
  completed: "受け渡し済み",
  cancelled: "中止"
};

export const statusOrder: OrderStatus[] = ["new", "confirmed", "cooking", "completed", "cancelled"];

export const statusStyles: Record<OrderStatus, string> = {
  new: "bg-red-600 text-white border-red-400",
  confirmed: "bg-amber-500 text-slate-950 border-amber-300",
  cooking: "bg-blue-600 text-white border-blue-400",
  completed: "bg-green-600 text-white border-green-400",
  cancelled: "bg-slate-500 text-white border-slate-400"
};

export const statusSoftStyles: Record<OrderStatus, string> = {
  new: "bg-red-50 text-red-700 border-red-200",
  confirmed: "bg-amber-50 text-amber-800 border-amber-200",
  cooking: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200"
};

export const receiveTypeLabels: Record<ReceiveType, string> = {
  pickup: "店頭",
  delivery: "配達"
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "現金",
  invoice: "請求",
  cashless: "キャッシュレス",
  other: "その他"
};

export const riceOptionLabels: Record<RiceOption, string> = {
  normal: "普通",
  large: "大盛",
  small: "少なめ",
  none: "なし"
};

export const productChoices = [
  "唐揚げ弁当",
  "日替わり弁当",
  "幕の内弁当",
  "のり弁",
  "焼き魚弁当",
  "お茶"
];
