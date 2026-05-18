"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileImage, Pencil, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { StatusActions } from "@/components/status-actions";
import { StatusBadge } from "@/components/status-badge";
import { addAttachment, getOrder, subscribeToOrderChanges } from "@/lib/order-store";
import { attachmentUrl } from "@/lib/attachments";
import { displayDateTime, displayTime } from "@/lib/date";
import { displayOrderNumber } from "@/lib/order-number";
import { paymentMethodLabels, receiveTypeLabels, riceOptionLabels, statusLabels } from "@/lib/constants";
import type { OrderWithRelations } from "@/lib/types";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await getOrder(params.id);
      setOrder(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "注文詳細の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    refresh();
    return subscribeToOrderChanges(refresh);
  }, [refresh]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    setError(null);
    try {
      await addAttachment(order.id, file);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-10">
          <Link href="/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>

          {loading ? <div className="text-slate-500">読み込み中...</div> : null}
          {error ? <div className="mb-4 rounded-md bg-red-50 p-4 font-bold text-red-700">{error}</div> : null}
          {!loading && !order ? <div className="rounded-lg bg-white p-6">注文が見つかりません。</div> : null}

          {order ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <section className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={order.status} />
                    <h1 className="text-3xl font-black text-slate-950">{order.customer_name}</h1>
                    <Link
                      href={`/orders/${order.id}/edit`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      編集
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Info label="受注番号" value={displayOrderNumber(order)} />
                    <Info label="注文ID" value={order.id} />
                    <Info label="電話番号" value={order.phone || "-"} />
                    <Info label="受取日時" value={`${order.pickup_date} ${displayTime(order.pickup_time)}`} />
                    <Info label="受取方法" value={receiveTypeLabels[order.receive_type]} />
                    <Info
                      label="支払い方法"
                      value={paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] ?? order.payment_method}
                    />
                    <Info label="登録元" value={order.source} />
                    {order.delivery_address ? <Info label="配達先" value={order.delivery_address} wide /> : null}
                    {order.note ? <Info label="備考" value={order.note} wide /> : null}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="text-xl font-black text-slate-950">商品一覧</h2>
                  <div className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 rounded-md bg-slate-50 p-3">
                        <div>
                          <div className="font-black text-slate-950">{item.product_name}</div>
                          <div className="text-sm text-slate-500">
                            ご飯：{riceOptionLabels[item.rice_option as keyof typeof riceOptionLabels] ?? item.rice_option}
                            {item.note ? ` / ${item.note}` : ""}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-slate-950">x{item.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="text-xl font-black text-slate-950">添付画像・ファイル</h2>
                  <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                    <Upload className="h-5 w-5" />
                    {uploading ? "アップロード中..." : "ファイルを追加"}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.csv,image/*,application/pdf"
                      onChange={upload}
                      disabled={uploading}
                    />
                  </label>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {order.attachments.length === 0 ? <div className="text-slate-500">添付はまだありません。</div> : null}
                    {order.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachmentUrl(attachment.file_path)}
                        target="_blank"
                        className="rounded-lg border border-slate-200 p-3 font-bold text-slate-700"
                      >
                        {attachment.file_type?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={attachmentUrl(attachment.file_path)}
                            alt={attachment.file_name}
                            className="mb-2 aspect-video w-full rounded-md bg-slate-100 object-cover"
                          />
                        ) : (
                          <FileImage className="mb-2 h-10 w-10 text-slate-400" />
                        )}
                        {attachment.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="text-xl font-black text-slate-950">ステータス変更</h2>
                  <div className="mt-4">
                    <StatusActions order={order} onChanged={refresh} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <h2 className="text-xl font-black text-slate-950">変更履歴</h2>
                  <div className="mt-4 space-y-3">
                    {[...order.status_logs]
                      .sort((a, b) => b.created_at.localeCompare(a.created_at))
                      .map((log) => (
                        <div key={log.id} className="rounded-md bg-slate-50 p-3">
                          <div className="font-bold text-slate-900">
                            {log.old_status ? statusLabels[log.old_status] : "作成"} → {statusLabels[log.new_status]}
                          </div>
                          <div className="text-sm text-slate-500">{displayDateTime(log.created_at)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words font-bold text-slate-950">{value}</div>
    </div>
  );
}
