# 本番反映チェックリスト

## 目的

開発用 `develop` で確認した変更を、本番用 `main` / Production に安全に反映するためのチェックリストです。

本番反映は、注文データ・Googleフォーム・スタッフ運用に直接影響します。
作業前にこのページを上から順に確認してください。

## 1. 本番反映前の前提

- [ ] `develop` Previewで動作確認が完了している
- [ ] `/orders` が問題なく表示される
- [ ] `/monitor` が問題なく表示される
- [ ] `/admin` のGoogleフォーム取込状況が問題なく表示される
- [ ] Googleフォームからの自動取込テストが開発環境で成功している
- [ ] 本番の商品マスタ `products.name` とGoogleフォームの商品質問名が一致している
- [ ] Googleフォーム回答先スプレッドシートの共有範囲を確認している
- [ ] 本番反映するタイミングを店舗側と確認している

## 2. 本番Supabase作業

本番Supabaseの SQL Editor で以下を実行します。

```text
supabase/google-form-imports.sql
```

確認すること:

- [ ] `google_form_imports` テーブルが作成されている
- [ ] `authenticated` に `select` 権限が付与されている
- [ ] `authenticated can read google form imports` policy が作成されている
- [ ] `google_form_imports_duplicate_key_unique` index が作成されている
- [ ] `google_form_imports_status_created_at_idx` index が作成されている
- [ ] `google_form_imports_sheet_row_number_idx` index が作成されている
- [ ] `google_form_imports_timestamp_phone_idx` index が作成されている

既存テーブルへの影響:

- `orders` の構造は変更しません
- `order_items` の構造は変更しません
- `products` の構造は変更しません
- `status_logs` の構造は変更しません
- 既存注文データは変更しません

`google_form_imports.imported_order_id` は `orders(id)` を参照します。
注文が削除された場合でも、取込履歴は残り、`imported_order_id` は `null` になります。

## 3. 本番Vercel環境変数

Vercelの本番プロジェクトで、Production に以下を設定します。

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_FORM_IMPORT_SECRET=
GOOGLE_FORM_RESPONSE_SHEET_URL=
```

確認すること:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` は本番SupabaseのURL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` は本番Supabaseのanon/publishable key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` は本番Supabaseのservice_role key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` に `NEXT_PUBLIC_` を付けていない
- [ ] `GOOGLE_FORM_IMPORT_SECRET` は本番用の共有シークレット
- [ ] `GOOGLE_FORM_RESPONSE_SHEET_URL` は本番の回答先スプレッドシートURL
- [ ] 開発Supabaseの値がProductionに混ざっていない

注意:

`SUPABASE_SERVICE_ROLE_KEY` は強い権限を持ちます。
GitHub、Apps Script、フロント側コードには絶対に書かないでください。

## 4. Apps Script作業

Google Apps Script の Script Properties を本番用に変更します。

```text
ORDER_API_URL=https://bento-order-monitor.vercel.app/api/google-form-order
ORDER_API_SECRET=本番Vercelの GOOGLE_FORM_IMPORT_SECRET と同じ値
```

確認すること:

- [ ] `ORDER_API_URL` が本番URLになっている
- [ ] `ORDER_API_SECRET` が本番Vercelの `GOOGLE_FORM_IMPORT_SECRET` と一致している
- [ ] secretの実値をコードに直書きしていない

トリガー:

- [ ] 関数は `onFormSubmit`
- [ ] Event source は `From spreadsheet`
- [ ] Event type は `On form submit`
- [ ] トリガーが有効になっている

## 5. 本番反映手順

1. [ ] `develop` の最終確認を行う
2. [ ] 本番Supabaseで `supabase/google-form-imports.sql` を実行する
3. [ ] 本番VercelのProduction環境変数を設定する
4. [ ] `develop` を `main` に反映する
5. [ ] Vercel Production Deploy が開始されたことを確認する
6. [ ] Production のビルドが成功したことを確認する
7. [ ] 本番URLで `/orders` を確認する
8. [ ] 本番URLで `/monitor` を確認する
9. [ ] 本番URLで `/admin` を確認する
10. [ ] Apps Script の Script Properties を本番用にする
11. [ ] 本番Googleフォームからテスト送信する

本番URL:

```text
https://bento-order-monitor.vercel.app
```

## 6. 本番テスト項目

### 店舗受取・単品

- [ ] Googleフォームで店舗受取、商品1つを送信する
- [ ] `/orders` に表示される
- [ ] `/monitor` に表示される
- [ ] 必要数に反映される
- [ ] `/admin` で `取込済み` になる

### 店舗受取・複数商品

- [ ] Googleフォームで店舗受取、商品2種類以上を送信する
- [ ] `/orders` の商品内訳が正しい
- [ ] `/monitor` の商品内訳が正しい
- [ ] 今日・明日の必要数が商品ごとに正しい

### 宅配・住所あり

- [ ] Googleフォームで宅配、住所ありで送信する
- [ ] `/monitor` に電話番号と配達先が表示される
- [ ] 注文詳細で配達先住所の全文が確認できる

### 商品未選択

- [ ] Googleフォームで商品を選ばず送信する
- [ ] `orders` に注文が登録されない
- [ ] `/admin` に `要確認` または `エラー` として表示される
- [ ] `error_message` が表示される

### /admin Googleフォーム取込状況

- [ ] `取込済み` 件数が分かる
- [ ] `要確認` 件数が分かる
- [ ] `エラー` 件数が分かる
- [ ] `重複` 件数が分かる
- [ ] pending_review / error が目立つ

### 回答先シートリンク

- [ ] `回答先を確認` リンクが表示される
- [ ] リンクから回答先スプレッドシートが別タブで開く
- [ ] 可能なら該当行付近が開く

### imported_order_id から注文詳細リンク

- [ ] `/admin` の `imported_order_id` から注文詳細に移動できる
- [ ] 注文番号、注文者名、電話番号、受取方法、商品、備考、登録元が確認できる

## 7. セキュリティ注意

- secretをGitHubに書かない
- `SUPABASE_SERVICE_ROLE_KEY` をApps Scriptに書かない
- `SUPABASE_SERVICE_ROLE_KEY` をフロント側コードに出さない
- `SUPABASE_SERVICE_ROLE_KEY` に `NEXT_PUBLIC_` を付けない
- Apps Scriptログに名前・電話番号・住所・secretを出さない
- Vercelログに個人情報を出さない
- `raw_payload` は `/admin` 一覧に表示しない
- 回答先スプレッドシートの共有範囲を必要最小限にする
- Googleフォームの商品名には価格を入れない
- Googleフォームの商品質問名と `/admin` の商品名を一致させる

## 8. ロールバック方針

問題が起きた場合は、注文の二重登録や不備注文の増加を防ぐため、まずGoogleフォームからの自動送信を止めます。

優先順:

1. [ ] Apps Script のトリガーを一時停止する
2. [ ] Apps Script の `ORDER_API_URL` を停止用URL、または開発Previewに一時変更する
3. [ ] Vercel Productionの前デプロイへ戻す
4. [ ] 本番DBに入ったテスト注文・不正注文の扱いを確認する
5. [ ] `/admin` のGoogleフォーム取込状況で `error` / `pending_review` / `duplicate` を確認する

注意:

本番DBに入った注文は、画面上の削除だけでよいのか、履歴として残すのかを店舗運用に合わせて判断します。
削除しても履歴に残す方針の場合、通常一覧・必要数から消えても、履歴としては残ります。
