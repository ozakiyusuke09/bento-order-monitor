"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CopyCheck, ExternalLink, HelpCircle } from "lucide-react";
import { useGoogleFormImports } from "@/hooks/use-google-form-imports";
import { displayDateTime } from "@/lib/date";
import type { GoogleFormImportRecord, GoogleFormImportStatus } from "@/lib/types";

const statusLabels: Record<GoogleFormImportStatus, string> = {
  imported: "取込済み",
  pending_review: "要確認",
  error: "エラー",
  duplicate: "重複"
};

const statusStyles: Record<GoogleFormImportStatus, string> = {
  imported: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending_review: "border-amber-300 bg-amber-50 text-amber-800",
  error: "border-red-300 bg-red-50 text-red-700",
  duplicate: "border-slate-300 bg-slate-100 text-slate-700"
};

export function GoogleFormImportStatusPanel() {
  const { imports, loading, error } = useGoogleFormImports();
  const [sheetUrl, setSheetUrl] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/google-form-response-sheet-url")
      .then((response) => (response.ok ? response.json() : { url: "" }))
      .then((data: { url?: string }) => {
        if (active) setSheetUrl(data.url || "");
      })
      .catch(() => {
        if (active) setSheetUrl("");
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = imports.reduce(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    { imported: 0, pending_review: 0, error: 0, duplicate: 0 } as Record<GoogleFormImportStatus, number>
  );
  const reviewCount = counts.pending_review + counts.error;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-500">Googleフォーム</div>
          <h2 className="text-xl font-black text-slate-950">Googleフォーム取込状況</h2>
        </div>
        <div
          className={
            reviewCount > 0
              ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right text-red-700"
              : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-emerald-700"
          }
        >
          <div className="text-xs font-black">要対応</div>
          <div className="text-2xl font-black leading-none">{reviewCount}<span className="ml-1 text-sm">件</span></div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <ImportMetric icon={<CheckCircle2 className="h-4 w-4" />} label="取込済み" value={counts.imported} status="imported" />
        <ImportMetric icon={<AlertTriangle className="h-4 w-4" />} label="要確認" value={counts.pending_review} status="pending_review" />
        <ImportMetric icon={<AlertTriangle className="h-4 w-4" />} label="エラー" value={counts.error} status="error" />
        <ImportMetric icon={<CopyCheck className="h-4 w-4" />} label="重複" value={counts.duplicate} status="duplicate" />
      </div>

      {loading ? <div className="mt-4 rounded-md bg-slate-50 p-4 font-bold text-slate-500">読み込み中...</div> : null}
      {error ? <div className="mt-4 rounded-md bg-red-50 p-4 font-bold text-red-700">{error}</div> : null}
      {!loading && !error && imports.length === 0 ? (
        <div className="mt-4 rounded-md bg-slate-50 p-4 font-bold text-slate-500">Googleフォーム取込履歴はまだありません。</div>
      ) : null}

      {imports.length > 0 ? (
        <>
          <div className="mt-4 space-y-2 lg:hidden">
            {imports.map((record) => (
              <ImportCard key={record.id} record={record} sheetUrl={sheetUrl} />
            ))}
          </div>

          <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
            <div className="grid grid-cols-[118px_150px_118px_96px_minmax(170px,1fr)_132px_72px_130px] gap-3 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
              <div>created_at</div>
              <div>form_timestamp</div>
              <div>phone</div>
              <div>status</div>
              <div>error_message</div>
              <div>imported_order_id</div>
              <div>行</div>
              <div>回答先</div>
            </div>
            <div className="divide-y divide-slate-100">
              {imports.map((record) => (
                <ImportTableRow key={record.id} record={record} sheetUrl={sheetUrl} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ImportMetric({
  icon,
  label,
  value,
  status
}: {
  icon: ReactNode;
  label: string;
  value: number;
  status: GoogleFormImportStatus;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${statusStyles[status]}`}>
      <div className="flex items-center gap-1.5 text-xs font-black">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-black leading-none">{value}<span className="ml-1 text-sm">件</span></div>
    </div>
  );
}

function ImportCard({ record, sheetUrl }: { record: GoogleFormImportRecord; sheetUrl: string }) {
  return (
    <div className={record.status === "error" || record.status === "pending_review" ? "rounded-lg border border-red-200 bg-red-50 p-3" : "rounded-lg border border-slate-200 bg-white p-3"}>
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={record.status} />
        <div className="text-xs font-bold text-slate-500">{formatCreatedAt(record.created_at)}</div>
      </div>
      <div className="mt-2 grid gap-1 text-sm font-bold text-slate-700">
        <ImportLine label="フォーム日時" value={record.form_timestamp || "-"} />
        <ImportLine label="電話番号" value={record.phone || "-"} />
        <ImportLine label="行番号" value={record.sheet_row_number ? `${record.sheet_row_number}` : "-"} />
        <ImportLine label="注文ID" value={<OrderLink orderId={record.imported_order_id} />} />
        <ImportLine label="回答先" value={<SheetRowLink sheetUrl={sheetUrl} sheetRowNumber={record.sheet_row_number} status={record.status} />} />
        {record.error_message ? <ImportLine label="内容" value={record.error_message} alert /> : null}
      </div>
    </div>
  );
}

function ImportTableRow({ record, sheetUrl }: { record: GoogleFormImportRecord; sheetUrl: string }) {
  return (
    <div className={record.status === "error" || record.status === "pending_review" ? "grid grid-cols-[118px_150px_118px_96px_minmax(170px,1fr)_132px_72px_130px] gap-3 bg-red-50/80 px-3 py-2.5 text-sm" : "grid grid-cols-[118px_150px_118px_96px_minmax(170px,1fr)_132px_72px_130px] gap-3 px-3 py-2.5 text-sm"}>
      <div className="font-bold text-slate-700">{formatCreatedAt(record.created_at)}</div>
      <div className="truncate font-bold text-slate-700" title={record.form_timestamp || undefined}>{record.form_timestamp || "-"}</div>
      <div className="truncate font-bold text-slate-700">{record.phone || "-"}</div>
      <div><StatusPill status={record.status} /></div>
      <div className={record.error_message ? "truncate font-bold text-red-700" : "truncate font-bold text-slate-500"} title={record.error_message || undefined}>
        {record.error_message || "-"}
      </div>
      <div className="truncate font-bold text-slate-700"><OrderLink orderId={record.imported_order_id} /></div>
      <div className="font-bold text-slate-700">{record.sheet_row_number ?? "-"}</div>
      <div><SheetRowLink sheetUrl={sheetUrl} sheetRowNumber={record.sheet_row_number} status={record.status} /></div>
    </div>
  );
}

function ImportLine({
  label,
  value,
  alert = false
}: {
  label: string;
  value: ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
      <div className="text-slate-500">{label}</div>
      <div className={alert ? "min-w-0 break-words text-red-700" : "min-w-0 break-words text-slate-900"}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: GoogleFormImportStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-black ${statusStyles[status]}`}>
      {(status === "error" || status === "pending_review") ? <AlertTriangle className="h-3.5 w-3.5" /> : <HelpCircle className="h-3.5 w-3.5" />}
      {statusLabels[status]}
    </span>
  );
}

function OrderLink({ orderId }: { orderId: string | null }) {
  if (!orderId) return <span>-</span>;
  return (
    <Link href={`/orders/${orderId}`} className="text-sky-700 hover:underline">
      {orderId.slice(0, 8)}
    </Link>
  );
}

function SheetRowLink({
  sheetUrl,
  sheetRowNumber,
  status
}: {
  sheetUrl: string;
  sheetRowNumber: number | null;
  status: GoogleFormImportStatus;
}) {
  if (!sheetRowNumber) return <span className="font-bold text-slate-400">行番号なし</span>;
  if (!sheetUrl) return <span className="font-bold text-slate-400">URL未設定</span>;

  const href = buildSheetRowUrl(sheetUrl, sheetRowNumber);
  const needsReview = status === "pending_review" || status === "error";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        needsReview
          ? "inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-black text-red-700 shadow-sm hover:bg-red-50"
          : "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
      }
    >
      回答先を確認
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function buildSheetRowUrl(sheetUrl: string, sheetRowNumber: number) {
  const range = `A${sheetRowNumber}:N${sheetRowNumber}`;
  try {
    const url = new URL(sheetUrl);
    const queryGid = url.searchParams.get("gid");
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashGid = hashParams.get("gid");
    const gid = queryGid || hashGid;
    url.hash = gid ? `gid=${gid}&range=${encodeURIComponent(range)}` : `range=${encodeURIComponent(range)}`;
    return url.toString();
  } catch {
    return sheetUrl;
  }
}

function formatCreatedAt(value: string) {
  try {
    return displayDateTime(value);
  } catch {
    return value;
  }
}
