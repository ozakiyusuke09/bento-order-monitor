"use client";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import type { GoogleFormImportRecord } from "@/lib/types";

export async function getGoogleFormImports(limit = 100) {
  if (!hasSupabaseEnv || !supabase) return [];

  const { data, error } = await supabase
    .from("google_form_imports")
    .select("id,created_at,form_timestamp,phone,status,error_message,imported_order_id,sheet_row_number")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as GoogleFormImportRecord[];
}

export function subscribeToGoogleFormImportChanges(onChange: () => void) {
  if (!hasSupabaseEnv || !supabase) return () => {};

  const client = supabase;
  const channel = client
    .channel("google-form-imports-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "google_form_imports" }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
