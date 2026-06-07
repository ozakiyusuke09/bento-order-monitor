"use client";

import { useCallback, useEffect, useState } from "react";
import { getGoogleFormImports, subscribeToGoogleFormImportChanges } from "@/lib/google-form-import-store";
import type { GoogleFormImportRecord } from "@/lib/types";

export function useGoogleFormImports() {
  const [imports, setImports] = useState<GoogleFormImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setImports(await getGoogleFormImports());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Googleフォーム取込状況の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return subscribeToGoogleFormImportChanges(refresh);
  }, [refresh]);

  return { imports, loading, error, refresh };
}
