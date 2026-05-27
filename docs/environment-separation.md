# 上司用と開発用を分ける手順

## 目的

上司やスタッフが触る画面と、開発中に試す画面を分けます。
開発中に不具合が出ても、上司用の画面や注文データに影響しないようにするためです。

## 分け方

### 上司・スタッフ用

- GitHub: `main`
- Vercel: 本番URL
- Supabase: 本番用データ

ここは安定版だけを反映します。

### 開発・確認用

- GitHub: `develop`
- Vercel: 開発用URL
- Supabase: 開発用データ

新しい機能やデザイン修正は、まずこちらで確認します。

## 運用ルール

1. 普段の開発は `develop` で行う
2. 開発用URLで確認する
3. 問題なければ `main` に反映する
4. 上司用URLには確認済みのものだけ出す

## Vercelでやること

1. 開発用のVercelプロジェクトを作る
2. GitHubの `develop` を使う設定にする
3. 開発用SupabaseのURLとキーを設定する

本番用Vercelには、本番用SupabaseのURLとキーを設定します。

## Supabaseでやること

1. 開発用Supabaseプロジェクトを新しく作る
2. 既存のSQLを開発用Supabaseで実行する
   - `supabase/schema.sql`
   - `supabase/order-number.sql`
   - `supabase/order-edit.sql`
   - `supabase/soft-delete.sql`
   - `supabase/products.sql`
   - `supabase/grants.sql`
   - `supabase/policies.sql`
3. 必要なら `supabase/seed.sql` でテストデータを入れる

## 注意

画面だけ分けても、Supabaseが同じだと注文データは共通になります。
安全に運用するには、VercelだけでなくSupabaseも本番用と開発用で分けます。
