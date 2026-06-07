# Googleフォーム注文取込 Apps Script

Googleフォーム回答先スプレッドシートに、フォーム送信時トリガーを設定して使います。

## Script Properties

Apps Script の `Project Settings` → `Script properties` に以下を保存してください。

```text
ORDER_API_URL=https://bento-order-monitor-git-develop-bento-order-monitor.vercel.app/api/google-form-order
ORDER_API_SECRET=Vercel の GOOGLE_FORM_IMPORT_SECRET と同じ値
```

本番反映後は `ORDER_API_URL` を本番URLに変更します。

```text
ORDER_API_URL=https://bento-order-monitor.vercel.app/api/google-form-order
```

## 受注システム側の環境変数

`/admin` の「Googleフォーム取込状況」から回答先スプレッドシートを確認できるように、Vercel側に以下を設定してください。

```text
GOOGLE_FORM_RESPONSE_SHEET_URL=https://docs.google.com/spreadsheets/d/xxxxx/edit?gid=xxxxx
```

`sheet_row_number` がある取込履歴では、このURLに行番号の範囲を付けて「回答先を確認」リンクを表示します。

## サンプルコード

```javascript
function onFormSubmit(e) {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('ORDER_API_URL');
  const apiSecret = props.getProperty('ORDER_API_SECRET');

  if (!apiUrl || !apiSecret) {
    throw new Error('ORDER_API_URL / ORDER_API_SECRET が未設定です。');
  }

  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const values = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
  const answers = {};

  headers.forEach(function(header, index) {
    if (!header) return;
    const value = values[index];
    answers[String(header).trim()] = value instanceof Date
      ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss')
      : value;
  });

  const payload = {
    sheetRowNumber: row,
    timestamp: answers['タイムスタンプ'],
    answers: answers,
    secret: apiSecret
  };

  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-google-form-import-secret': apiSecret
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (statusCode >= 200 && statusCode < 300) {
    console.log('注文取込API成功。status=' + statusCode);
    return;
  }

  if (statusCode === 422) {
    console.log('注文取込API: 要確認として記録済みです。status=' + statusCode);
    console.log('API response body=' + responseBody);
    return;
  }

  if (statusCode === 401) {
    console.log('注文取込APIの認証に失敗しました。status=' + statusCode);
    throw new Error('注文取込APIの認証に失敗しました。ORDER_API_SECRETを確認してください。');
  }

  if (statusCode >= 500) {
    console.log('注文取込APIでサーバーエラーが発生しました。status=' + statusCode);
    throw new Error('注文取込APIでサーバーエラーが発生しました。status=' + statusCode);
  }

  console.log('注文取込APIが失敗しました。status=' + statusCode);
  console.log('API response body=' + responseBody);
  throw new Error('注文取込APIが失敗しました。status=' + statusCode);
}
```

## トリガー設定

1. Apps Script 左メニューの `Triggers` を開く
2. `Add Trigger` を押す
3. 関数に `onFormSubmit` を選ぶ
4. Event source は `From spreadsheet`
5. Event type は `On form submit`
6. 保存

## 注意

- 商品の質問タイトルは `/admin` の商品名と完全一致させます。
- 価格はGoogleフォームの説明欄に書き、質問タイトルには入れません。
- Apps Scriptにシークレットを直書きしないでください。
- 実行ログに名前・電話番号・住所を出さないでください。
