# テスト設計: validation.ts

## 対象

- 対象機能: レポート入力バリデーション + 外部URLバリデーション + タグ正規化
- 対象ファイル: `front/src/lib/validation.ts`
- スタック: Frontend (Next.js 16 / Vitest)
- テストファイル: `front/src/lib/__tests__/validation.test.ts`

## モック方針

- モック不要（純粋関数のみ）
- `CATEGORIES` 定数は実際の値をそのまま使用する

---

## テストケース一覧

### validateReportInput — 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 全必須項目入力で正常に通過 | title/content/category/author/tags すべて有効値 | errors が空、data に正規化値が入る | High |
| N-2 | summary を空文字で渡すと null に正規化 | summary: "" | data.summary === null | Medium |
| N-3 | publishDate を ISO文字列で渡すと Date に変換 | publishDate: "2024-01-15" | data.publishDate が Date インスタンス | Medium |
| N-4 | publishDate を null で渡すと null のまま保持 | publishDate: null | data.publishDate === null | Medium |
| N-5 | partial:true で title のみ更新 | { title: "New" }, { partial: true } | errors 空、data.title === "New"、他フィールドなし | High |
| N-6 | partial:true で tags を空配列で渡してもエラーなし | { tags: [] }, { partial: true } | errors.tags なし（partial では tags 必須チェック無し） | Medium |
| N-7 | カテゴリ固定リスト全8種が通過 | 各カテゴリ名 | errors.category なし | Medium |

### validateReportInput — 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | title 未入力でエラー | title: "" | errors.title === "タイトルは必須です。" | High |
| S-2 | title 201文字でエラー | title: "a".repeat(201) | errors.title に "200文字以内" | High |
| S-3 | title 200文字ちょうどは通過 | title: "a".repeat(200) | errors.title なし | Medium |
| S-4 | content 未入力でエラー | content: "" | errors.content === "本文は必須です。" | High |
| S-5 | content 50001文字でエラー | content: "a".repeat(50001) | errors.content に "50000文字以内" | Medium |
| S-6 | category 未入力でエラー | category: "" | errors.category === "カテゴリは必須です。" | High |
| S-7 | category 不正値でエラー | category: "Invalid" | errors.category に "次のいずれか" | High |
| S-8 | author 未入力でエラー | author: "" | errors.author === "著者は必須です。" | High |
| S-9 | tags 空配列（非partial）でエラー | tags: [] | errors.tags === "タグは1つ以上必要です。" | High |
| S-10 | tags 21個でエラー | tags: 21個の配列 | errors.tags に "20個以内" | Medium |
| S-11 | タグ1つが51文字でエラー | tags: ["#" + "a".repeat(50)] | errors.tags に "50文字以内" | Medium |
| S-12 | summary 501文字でエラー | summary: "a".repeat(501) | errors.summary に "500文字以内" | Medium |
| S-13 | title が数値型の場合は空文字扱い | title: 123 (as unknown) | errors.title === "タイトルは必須です。" | Low |
| S-14 | 前後空白はトリムされる | title: "  hello  " | data.title === "hello" | Medium |

### validateReportInput — 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| A-1 | publishDate に不正文字列 | publishDate: "not-a-date" | data.publishDate が undefined（無視） | Medium |
| A-2 | tags に非文字列要素混在 | tags: ["AI", 123, null] | 非文字列は除外され ["#AI"] のみ | Low |

---

### normalizeTags — 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| NT-1 | 文字列カンマ区切りで # 付与 | "AI, Cloud, #Linux" | ["#AI", "#Cloud", "#Linux"] | High |
| NT-2 | 配列入力で # 付与 | ["AI", "#Cloud"] | ["#AI", "#Cloud"] | High |
| NT-3 | 空文字・空白のみはフィルタ | "AI, , ,Cloud" | ["#AI", "#Cloud"] | Medium |
| NT-4 | 非配列・非文字列は空配列 | 123 | [] | Medium |
| NT-5 | null/undefined は空配列 | null | [] | Medium |

---

### validateExternalUrls — 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| EU-N-1 | 有効なURL配列が通過 | [{ url: "https://example.com", label: "Example" }] | errors 空、data に1件 | High |
| EU-N-2 | label 空文字は許可 | [{ url: "https://example.com", label: "" }] | errors 空 | High |
| EU-N-3 | null/undefined 入力は空結果 | null | data: [], errors: {} | Medium |
| EU-N-4 | http:// も許可 | [{ url: "http://example.com", label: "" }] | errors 空 | Medium |

### validateExternalUrls — 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| EU-S-1 | URL 未入力でエラー | [{ url: "", label: "test" }] | errors["externalUrls.0.url"] に "必須" | High |
| EU-S-2 | URL が http/https 以外でエラー | [{ url: "ftp://x.com", label: "" }] | errors["externalUrls.0.url"] に "http://" | High |
| EU-S-3 | ラベル 201文字でエラー | [{ url: "https://x.com", label: "a".repeat(201) }] | errors["externalUrls.0.label"] に "200文字以内" | Medium |
| EU-S-4 | 複数行で行単位エラー | [{ url: "", label: "" }, { url: "bad", label: "" }] | externalUrls.0.url と externalUrls.1.url にエラー | Medium |

### validateExternalUrls — 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| EU-A-1 | 配列でない値 | "not-array" | errors["externalUrls"] に "配列で指定" | Medium |
| EU-A-2 | 要素の url/label が非文字列 | [{ url: 123, label: null }] | url は空文字扱いでエラー、label は空文字扱いで通過 | Low |
