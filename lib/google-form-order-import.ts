import type { ReceiveType } from "@/lib/types";

const FIELD_NAMES = {
  timestamp: "タイムスタンプ",
  customerName: "お名前",
  phone: "電話番号",
  pickupDate: "受取希望日",
  pickupTime: "受取希望時刻",
  receiveType: "受け取り方法",
  deliveryAddress: "お届け先住所",
  note: "備考"
} as const;

const SYSTEM_FIELD_NAMES = new Set<string>(Object.values(FIELD_NAMES));

export type GoogleFormImportPayload = {
  sheetRowNumber?: number | string | null;
  timestamp?: string | null;
  answers?: Record<string, unknown>;
  secret?: string | null;
};

export type ParsedGoogleFormOrder = {
  duplicateKey: string;
  sheetRowNumber: number | null;
  formTimestamp: string;
  phone: string;
  order: {
    customer_name: string;
    phone: string;
    pickup_date: string;
    pickup_time: string;
    receive_type: ReceiveType;
    delivery_address: string | null;
    payment_method: string;
    note: string | null;
    source: "google_form";
    status: "new";
  };
  items: Array<{
    product_name: string;
    quantity: number;
    rice_option: "normal";
    note: null;
  }>;
  redactedPayload: Record<string, unknown>;
};

type ProductForImport = {
  name: string;
  is_active: boolean;
};

export class GoogleFormImportError extends Error {
  status: "error" | "pending_review";

  constructor(message: string, status: "error" | "pending_review" = "pending_review") {
    super(message);
    this.name = "GoogleFormImportError";
    this.status = status;
  }
}

export function parseGoogleFormOrder(payload: GoogleFormImportPayload, products: ProductForImport[]): ParsedGoogleFormOrder {
  const answers = payload.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new GoogleFormImportError("answers が不正です。", "error");
  }

  const productNames = new Set(products.filter((product) => product.is_active).map((product) => product.name));
  const sheetRowNumber = parseOptionalPositiveInteger(payload.sheetRowNumber);
  const formTimestamp = cleanText(payload.timestamp ?? answers[FIELD_NAMES.timestamp]);
  const customerName = cleanText(answers[FIELD_NAMES.customerName]);
  const phone = cleanText(answers[FIELD_NAMES.phone]);
  const pickupDate = parsePickupDate(answers[FIELD_NAMES.pickupDate]);
  const pickupTime = parsePickupTime(answers[FIELD_NAMES.pickupTime]);
  const receiveType = parseReceiveType(answers[FIELD_NAMES.receiveType]);
  const deliveryAddress = cleanText(answers[FIELD_NAMES.deliveryAddress]);
  const note = cleanText(answers[FIELD_NAMES.note]);

  if (!formTimestamp) throw new GoogleFormImportError("タイムスタンプがありません。", "error");
  if (!customerName) throw new GoogleFormImportError("お名前がありません。");
  if (!phone) throw new GoogleFormImportError("電話番号がありません。");
  if (!pickupDate) throw new GoogleFormImportError("受取希望日が不正です。");
  if (!pickupTime) throw new GoogleFormImportError("受取希望時刻が不正です。");
  if (!receiveType) throw new GoogleFormImportError("受け取り方法が不正です。");
  if (receiveType === "delivery" && !deliveryAddress) {
    throw new GoogleFormImportError("宅配ですがお届け先住所がありません。");
  }

  const items: ParsedGoogleFormOrder["items"] = [];
  const unknownProductColumns: string[] = [];
  const invalidQuantityColumns: string[] = [];

  for (const [header, rawValue] of Object.entries(answers)) {
    if (SYSTEM_FIELD_NAMES.has(header)) continue;
    const value = cleanText(rawValue);
    if (!value) continue;

    if (!productNames.has(header)) {
      unknownProductColumns.push(header);
      continue;
    }

    const quantity = parseQuantity(value);
    if (!quantity) {
      invalidQuantityColumns.push(header);
      continue;
    }

    items.push({
      product_name: header,
      quantity,
      rice_option: "normal",
      note: null
    });
  }

  if (unknownProductColumns.length) {
    throw new GoogleFormImportError(`商品マスタにない商品列があります: ${unknownProductColumns.join(", ")}`);
  }
  if (invalidQuantityColumns.length) {
    throw new GoogleFormImportError(`数量形式が不正な商品があります: ${invalidQuantityColumns.join(", ")}`);
  }
  if (!items.length) throw new GoogleFormImportError("商品が1つも選択されていません。");

  const duplicateKey = sheetRowNumber ? `row:${sheetRowNumber}` : `timestamp-phone:${formTimestamp}:${phone}`;

  return {
    duplicateKey,
    sheetRowNumber,
    formTimestamp,
    phone,
    order: {
      customer_name: customerName,
      phone,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      receive_type: receiveType,
      delivery_address: receiveType === "delivery" ? deliveryAddress : null,
      payment_method: "cash",
      note: note || null,
      source: "google_form",
      status: "new"
    },
    items,
    redactedPayload: redactPayload(payload)
  };
}

export function redactPayload(payload: GoogleFormImportPayload) {
  const answers = payload.answers ?? {};
  const redactedAnswers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key === FIELD_NAMES.customerName || key === FIELD_NAMES.phone || key === FIELD_NAMES.deliveryAddress) {
      redactedAnswers[key] = "[redacted]";
    } else {
      redactedAnswers[key] = value;
    }
  }

  return {
    sheetRowNumber: payload.sheetRowNumber ?? null,
    timestamp: payload.timestamp ?? null,
    answers: redactedAnswers
  };
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseOptionalPositiveInteger(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function parsePickupDate(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  const normalized = text.replaceAll("/", "-");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return "";
  const [, year, month, day] = match;
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return date;
}

function parsePickupTime(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseReceiveType(value: unknown): ReceiveType | "" {
  const text = cleanText(value);
  if (text === "店舗" || text === "店頭" || text === "店舗受取" || text === "店舗受け取り") return "pickup";
  if (text === "宅配" || text === "配達") return "delivery";
  return "";
}

function parseQuantity(value: string) {
  const normalized = value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
  const match = normalized.match(/^(\d+)\s*個?$/);
  if (!match) return null;
  const quantity = Number(match[1]);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
}
