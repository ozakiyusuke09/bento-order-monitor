# 弁当屋 受注モニターシステム MVP

Next.js App Router + TypeScript + Tailwind CSS + Supabase で作る、社内テスト用の受注モニターMVPです。

## 実装済み

- `/login` Supabase Authログイン。環境変数未設定時はダミーログインで動作
- `/orders` 本日の注文一覧。スマホ向けカードUI、ステータス変更、商品別合計
- `/orders/new` 注文登録。複数商品、店頭/配達、支払い方法、備考
- `/orders/[id]` 注文詳細。ステータス変更履歴、添付ファイル手動アップロード
- `/monitor` 大型モニター用ダークUI。本日の注文、件数、商品別合計、Realtime反映
- `/admin` 簡易ダッシュボード
- `orders` / `order_items` / `status_logs` / `order_attachments` のSQL
- Supabase Storage `order-attachments` バケット想定
- Supabase未設定でもブラウザ内モックデータで画面確認可能

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 環境変数

`.env.example` を参考に `.env.local` を作成します。
開発用Supabaseを使う場合は `.env.development.example` も参考にしてください。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` はサーバー側専用です。ブラウザで読み込むコードや `NEXT_PUBLIC_` には絶対に入れないでください。

## Supabase準備

1. Supabaseプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. 必要に応じて `supabase/seed.sql` を実行します。
4. Authenticationでテストスタッフのメールアドレスとパスワードを作成します。
5. `.env.local` にURLとAnon Keyを設定します。

## Realtime

`supabase/schema.sql` は以下のテーブルを `supabase_realtime` publication に追加します。

- `orders`
- `order_items`
- `status_logs`
- `order_attachments`

Supabase管理画面のDatabase Replication設定で、対象テーブルがRealtime対象になっていることも確認してください。

## RLS方針

初期MVPでは「ログイン済みスタッフのみ閲覧・登録・更新可能」という単純な方針です。

- `authenticated` は注文、商品、履歴、添付情報を閲覧可能
- `authenticated` は注文登録、商品登録、ステータス履歴登録、添付情報登録が可能
- 本番運用前に `admin` / `staff` / `delivery` / `viewer` のロール設計を追加してください
- 大型モニター専用アカウントを作る場合は、閲覧専用ポリシーへの分離を推奨します

## 添付ファイル

Storageバケットは `order-attachments` を使用します。

保存パスの例：

```text
orders/{order_id}/{timestamp}_{file_name}
```

想定ファイル：

- jpg / jpeg / png / webp
- pdf
- xlsx
- csv

画像は注文詳細でサムネイル表示し、PDFやExcelはファイルリンクとして表示します。

## 将来拡張の入口

- LINE注文は `orders.source = 'line'`
- Web注文は `orders.source = 'web'`
- メール注文は `orders.source = 'email'`
- 電話注文は `orders.source = 'phone'`
- 商品マスタ、顧客マスタ、配達管理、売上集計は `products` / `customers` と新規ルートで拡張します
