"use client";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";

export function attachmentUrl(filePath: string) {
  if (filePath.startsWith("blob:") || filePath.startsWith("http")) return filePath;
  if (hasSupabaseEnv && supabase) {
    return supabase.storage.from("order-attachments").getPublicUrl(filePath).data.publicUrl;
  }
  return filePath;
}
