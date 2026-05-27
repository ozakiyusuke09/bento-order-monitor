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
4. 開発用URLにアクセスしてログインできるか確認する

本番用Vercelには、本番用SupabaseのURLとキーを設定します。

### Vercelに入れる値

本番用Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=本番用SupabaseのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=本番用SupabaseのAnon Key
SUPABASE_SERVICE_ROLE_KEY=本番用SupabaseのService Role Key
```

開発用Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=開発用SupabaseのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=開発用SupabaseのAnon Key
SUPABASE_SERVICE_ROLE_KEY=開発用SupabaseのService Role Key
```

本番用と開発用で、ここに入れる値を絶対に混ぜないようにします。

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
4. Authenticationで開発用ログインユーザーを作る

### Supabaseでコピーする値

Supabaseの管理画面で、開発用プロジェクトの以下をコピーします。

- Project URL
- anon public key
- service_role key

`service_role key` は強い権限を持つため、画面に表示するコードには入れません。
Vercelの環境変数、または自分のPCの `.env.local` にだけ入れます。

## 自分のPCで開発用データを使う場合

`.env.development.example` を見本にして、`.env.local` に開発用Supabaseの値を入れます。

```text
NEXT_PUBLIC_SUPABASE_URL=開発用SupabaseのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=開発用SupabaseのAnon Key
SUPABASE_SERVICE_ROLE_KEY=開発用SupabaseのService Role Key
```

`.env.local` はGitHubに上げない設定になっています。

## 注意

画面だけ分けても、Supabaseが同じだと注文データは共通になります。
安全に運用するには、VercelだけでなくSupabaseも本番用と開発用で分けます。

## 次回以降の開発の流れ

1. こちらで `develop` に修正を入れる
2. 開発用URLで確認する
3. 問題なければ `main` に反映する
4. 上司用URLで安定版として使う
