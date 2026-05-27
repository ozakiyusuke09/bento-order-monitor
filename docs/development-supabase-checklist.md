# 開発用Supabaseを作るチェックリスト

## 目的

開発用の注文データ保存場所を作ります。
これにより、開発中に注文を登録・削除・編集しても、上司用のデータに影響しません。

## 1. Supabaseで新しいプロジェクトを作る

Supabaseで新しいプロジェクトを作ります。
名前は分かりやすく、例えば以下にします。

```text
bento-order-monitor-dev
```

これは開発用です。
本番用とは別物として扱います。

## 2. SQLを実行する

Supabaseの左メニューから SQL Editor を開きます。

まず以下を実行します。

```text
supabase/schema.sql
```

そのあと、念のため以下も実行します。

```text
supabase/products.sql
supabase/grants.sql
supabase/policies.sql
```

テスト注文を入れたい場合だけ、最後に以下を実行します。

```text
supabase/seed.sql
```

## 3. ログインユーザーを作る

Supabaseの Authentication で、開発用にログインするユーザーを作ります。

例:

```text
dev@example.com
```

本番用スタッフと同じメールを使っても動きますが、開発用だと分かるメールの方が安全です。

## 4. Vercelに入れる値をコピーする

Supabaseの Project Settings から、以下をコピーします。

```text
Project URL
anon public key
service_role key
```

Vercelの開発用環境には、開発用Supabaseの値だけを入れます。

```text
NEXT_PUBLIC_SUPABASE_URL=開発用のProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=開発用のanon public key
SUPABASE_SERVICE_ROLE_KEY=開発用のservice_role key
```

## 5. 確認すること

開発用URLで以下を確認します。

- ログインできる
- 注文登録できる
- 注文一覧に表示される
- 商品管理で商品を登録・編集できる
- 本番用URLの注文データが変わっていない

## 注意

開発用Vercelに本番用Supabaseの値を入れると、データが分かれません。
開発用には必ず開発用Supabaseの値を入れてください。
