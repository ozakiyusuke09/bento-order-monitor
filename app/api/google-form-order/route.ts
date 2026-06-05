import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GoogleFormImportError, parseGoogleFormOrder, redactPayload, type GoogleFormImportPayload } from "@/lib/google-form-order-import";
import { formatOrderNumber } from "@/lib/order-number";

export const runtime = "nodejs";

type ImportStatus = "imported" | "duplicate" | "error" | "pending_review";

export async function POST(request: Request) {
  const expectedSecret = process.env.GOOGLE_FORM_IMPORT_SECRET;
  let payload: GoogleFormImportPayload;
  try {
    payload = (await request.json()) as GoogleFormImportPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const headerSecret = request.headers.get("x-google-form-import-secret");
  const bodySecret = typeof payload.secret === "string" ? payload.secret : null;

  if (!isAuthorized(expectedSecret, headerSecret, bodySecret)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        diagnostics: buildUnauthorizedDiagnostics(expectedSecret, headerSecret, bodySecret)
      },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: products, error: productsError } = await supabase.from("products").select("name,is_active");
    if (productsError) throw productsError;

    const parsed = parseGoogleFormOrder(payload, products ?? []);
    const duplicate = await findExistingImport(supabase, parsed.sheetRowNumber, parsed.formTimestamp, parsed.phone);
    if (duplicate) {
      await recordImport(supabase, {
        payload,
        status: "duplicate",
        errorMessage: "すでに取り込み済みの回答です。",
        sheetRowNumber: parsed.sheetRowNumber,
        formTimestamp: parsed.formTimestamp,
        phone: parsed.phone,
        duplicateKey: `${parsed.duplicateKey}:duplicate:${Date.now()}`
      });
      return NextResponse.json({ ok: true, status: "duplicate" });
    }

    const reserved = await reserveImport(supabase, parsed);
    if (!reserved) {
      return NextResponse.json({ ok: true, status: "duplicate" });
    }

    let orderId: string;
    try {
      orderId = await createImportedOrder(supabase, parsed);
    } catch (caught) {
      await updateReservedImport(supabase, parsed.duplicateKey, {
        status: "error",
        error_message: "注文登録に失敗しました。"
      });
      throw caught;
    }

    await updateReservedImport(supabase, parsed.duplicateKey, {
      status: "imported",
      imported_order_id: orderId,
      imported_at: new Date().toISOString(),
      error_message: null
    });

    return NextResponse.json({ ok: true, status: "imported", orderId });
  } catch (caught) {
    const importError = caught instanceof GoogleFormImportError ? caught : null;
    const status = importError?.status ?? "error";
    const errorMessage = importError?.message ?? "Googleフォーム回答の取り込みに失敗しました。";
    const answers = payload.answers ?? {};
    await recordImport(supabase, {
      payload,
      status,
      errorMessage,
      sheetRowNumber: parseSheetRowNumber(payload.sheetRowNumber),
      formTimestamp: safeText(payload.timestamp ?? answers["タイムスタンプ"]),
      phone: safeText(answers["電話番号"]),
      duplicateKey: `error:${safeText(payload.timestamp ?? answers["タイムスタンプ"])}:${safeText(answers["電話番号"])}:${Date.now()}`
    });

    return NextResponse.json({ ok: false, status, error: errorMessage }, { status: 422 });
  }
}

async function createImportedOrder(supabase: ReturnType<typeof getSupabaseAdmin>, parsed: ReturnType<typeof parseGoogleFormOrder>) {
  let order: { id: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const numbering = await getNextDailyOrderNumber(supabase, parsed.order.pickup_date);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        ...parsed.order,
        ...numbering,
        created_by: null
      })
      .select("id")
      .single();

    if (!error) {
      order = data;
      break;
    }

    if (error.code !== "23505" || attempt === 1) throw error;
  }

  if (!order) throw new Error("注文登録に失敗しました。");

  const { error: itemsError } = await supabase.from("order_items").insert(parsed.items.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) throw itemsError;

  const { error: logError } = await supabase.from("status_logs").insert({
    order_id: order.id,
    old_status: null,
    new_status: "new",
    changed_by: null,
    note: "Googleフォーム取込"
  });
  if (logError) throw logError;

  return order.id;
}

async function getNextDailyOrderNumber(supabase: ReturnType<typeof getSupabaseAdmin>, pickupDate: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("daily_sequence")
    .eq("pickup_date", pickupDate)
    .order("daily_sequence", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) throw error;
  const nextSequence = (data?.[0]?.daily_sequence ?? 0) + 1;
  return {
    order_no: formatOrderNumber(pickupDate, nextSequence),
    daily_sequence: nextSequence
  };
}

async function findExistingImport(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sheetRowNumber: number | null,
  formTimestamp: string,
  phone: string
) {
  if (sheetRowNumber) {
    const { data, error } = await supabase
      .from("google_form_imports")
      .select("id,status")
      .eq("sheet_row_number", sheetRowNumber)
      .eq("status", "imported")
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await supabase
    .from("google_form_imports")
    .select("id,status")
    .eq("form_timestamp", formTimestamp)
    .eq("phone", phone)
    .eq("status", "imported")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function recordImport(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: {
    payload: GoogleFormImportPayload;
    status: ImportStatus;
    duplicateKey: string;
    sheetRowNumber: number | null;
    formTimestamp: string;
    phone: string;
    importedOrderId?: string;
    errorMessage?: string;
  }
) {
  const { error } = await supabase.from("google_form_imports").insert({
    sheet_row_number: input.sheetRowNumber,
    form_timestamp: input.formTimestamp || null,
    phone: input.phone || null,
    imported_order_id: input.importedOrderId ?? null,
    imported_at: input.status === "imported" ? new Date().toISOString() : null,
    status: input.status,
    error_message: input.errorMessage ?? null,
    duplicate_key: input.duplicateKey,
    raw_payload: redactPayload(input.payload)
  });

  if (error && error.code !== "23505") throw error;
}

async function reserveImport(supabase: ReturnType<typeof getSupabaseAdmin>, parsed: ReturnType<typeof parseGoogleFormOrder>) {
  const { error } = await supabase.from("google_form_imports").insert({
    sheet_row_number: parsed.sheetRowNumber,
    form_timestamp: parsed.formTimestamp,
    phone: parsed.phone,
    imported_order_id: null,
    imported_at: null,
    status: "pending_review",
    error_message: "取込処理中",
    duplicate_key: parsed.duplicateKey,
    raw_payload: parsed.redactedPayload
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function updateReservedImport(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  duplicateKey: string,
  patch: {
    status: ImportStatus;
    imported_order_id?: string | null;
    imported_at?: string | null;
    error_message?: string | null;
  }
) {
  const { error } = await supabase.from("google_form_imports").update(patch).eq("duplicate_key", duplicateKey);
  if (error) throw error;
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseSheetRowNumber(value: unknown) {
  const number = Number(safeText(value));
  return Number.isInteger(number) && number > 0 ? number : null;
}

function isAuthorized(expectedSecret: string | undefined, headerSecret: string | null, bodySecret: string | null) {
  if (!expectedSecret) return false;
  return headerSecret === expectedSecret || bodySecret === expectedSecret;
}

function buildUnauthorizedDiagnostics(expectedSecret: string | undefined, headerSecret: string | null, bodySecret: string | null) {
  const expectedSecretExists = Boolean(expectedSecret);
  const headerSecretExists = Boolean(headerSecret);
  const bodySecretExists = Boolean(bodySecret);
  const expectedSecretLength = expectedSecret?.length ?? 0;
  const headerSecretLength = headerSecret?.length ?? 0;
  const bodySecretLength = bodySecret?.length ?? 0;
  const reason = !expectedSecretExists
    ? "missing_server_secret"
    : !headerSecretExists && !bodySecretExists
      ? "missing_request_secret"
      : "secret_mismatch";

  return {
    expectedSecretExists,
    headerSecretExists,
    bodySecretExists,
    expectedSecretLength,
    headerSecretLength,
    bodySecretLength,
    reason
  };
}
