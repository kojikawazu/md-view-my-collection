# テスト設計: E2E テスト強化

## 対象

- 対象機能: 既存E2E（TC-001〜TC-030）の強化 + 新規ケース追加
- 対象ファイル: `front/tests/e2e/app.spec.ts`
- スタック: Frontend (Next.js 16 / Playwright)
- 新規ファイル: `front/tests/e2e/helpers.ts`（共有ヘルパー抽出）

## 方針

youtube-my-collection を参考に以下を実施:
1. **helpers.ts への共通処理抽出** — fixture データ、setStorage、createPagedReportsFixture を分離
2. **準正常系・異常系の追加** — API失敗、二重送信防止、許可メール不一致
3. **既存 TC-026〜TC-030 は実装済み** — 追加エッジケースを設計

## ヘルパー分離設計

`front/tests/e2e/helpers.ts` に以下を抽出:

```typescript
// fixtures
export const reportsFixture = [...];
export const userFixture = {...};
export const createPagedReportsFixture = (count: number) => [...];

// setup
export const setStorage = async (page, options) => {...};
```

---

## 新規テストケース一覧

### 準正常系（既存テストの強化）

| # | テストケース | 前提 | 手順 | 期待結果 | 優先度 |
|---|---|---|---|---|---|
| TC-008-2 | 許可メール不一致でエラー | 未ログイン | 許可外メールでログイン | エラーメッセージ表示（URL ?error=unauthorized） | High |
| TC-031 | 投稿確認モーダルの二重クリック防止 | ログイン済 | 新規作成 → 確認 → 投稿ボタン連打 | ボタンが disabled になり "処理中..." 表示、投稿は1回のみ | High |
| TC-032 | 編集確認モーダルの二重クリック防止 | ログイン済 | 編集 → 確認 → 保存ボタン連打 | ボタンが disabled になり "処理中..." 表示 | High |
| TC-033 | 削除確認モーダルの二重クリック防止 | ログイン済 | 詳細 → 削除 → 確認 → 削除ボタン連打 | ボタンが disabled になり "処理中..." 表示 | High |
| TC-034 | 一覧ページ戻り時にフィルタリセット確認 | カテゴリフィルタ適用中 | 詳細 → ブラウザバック → 一覧 | フィルタが解除され全件表示 | Medium |

### 異常系（新規）

| # | テストケース | 前提 | 手順 | 期待結果 | 優先度 |
|---|---|---|---|---|---|
| TC-035 | 詳細画面で存在しないレポートID（数値型） | — | /report/99999 に直アクセス | "Report Not Found" 表示 | Medium |
| TC-036 | 外部URL ラベル空 + URL 空の行は無視される | ログイン済 | URL追加 → 両方空のまま → 別行に有効URL → 投稿 | 空行は無視され、有効URLのみ保存 | Medium |

### 構成変更（リファクタリング）

| # | 変更内容 | 優先度 |
|---|---|---|
| R-1 | fixture データ・setStorage 関数を `helpers.ts` に抽出 | High |
| R-2 | `app.spec.ts` を `helpers.ts` から import する形に変更 | High |
| R-3 | TC-008-2 の実装（既存仕様にあるが未実装） | High |

---

## 既存テスト（TC-026〜TC-030）のステータス

| TC | 内容 | ステータス |
|---|---|---|
| TC-026 | URL 0件の詳細表示 | 実装済み |
| TC-027 | URL 複数件の詳細表示 | 実装済み |
| TC-028 | 新規作成でURL追加 | 実装済み |
| TC-029 | 編集でURL追加・削除 | 実装済み |
| TC-030 | 不正URL入力 | 実装済み |
