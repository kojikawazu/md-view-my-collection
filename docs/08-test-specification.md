# E2Eテスト仕様（厳密版）

## 目次

- [前提データ作成方針](#前提データ作成方針)
- [実行方法](#実行方法)
- [CI（GitHub Actions）](#cigithub-actions)
- [テストデータ注入](#テストデータ注入)
- [現行の自動テスト実装範囲](#現行の自動テスト実装範囲)
- [画面×観点マトリクス（前提/手順/期待）](#画面観点マトリクス前提手順期待)
  - [一覧（/）](#一覧)
  - [詳細（/report/:id）](#詳細reportid)
  - [新規作成（/report/new）](#新規作成reportnew)
  - [編集（/report/:id/edit）](#編集reportidedit)
  - [ログイン（/login）](#ログインlogin)
  - [削除/ログアウト](#削除ログアウト)
  - [Markdown Style Lab（/report/markdown-lab）](#markdown-style-labreportmarkdown-lab)
- [詳細テストケース（ID/前提/手順/期待）](#詳細テストケースid前提手順期待)
  - [外部URL管理（詳細: `docs/03-functional-specification.md`）](#外部url管理詳細-docs03-functional-specificationmd)
  - [追加テストケース（二重送信防止・エッジケース）](#追加テストケース二重送信防止エッジケース)
- [テスト設計（ユニット / E2E強化）](#テスト設計ユニット--e2e強化)
- [テスト設計: validation.ts](#テスト設計-validationts)
  - [対象](#対象)
  - [モック方針](#モック方針)
  - [テストケース一覧](#テストケース一覧)
    - [validateReportInput — 正常系](#validatereportinput--正常系)
    - [validateReportInput — 準正常系](#validatereportinput--準正常系)
    - [validateReportInput — 異常系](#validatereportinput--異常系)
    - [normalizeTags — 正常系](#normalizetags--正常系)
    - [validateExternalUrls — 正常系](#validateexternalurls--正常系)
    - [validateExternalUrls — 準正常系](#validateexternalurls--準正常系)
    - [validateExternalUrls — 異常系](#validateexternalurls--異常系)
- [テスト設計: hooks ユニットテスト](#テスト設計-hooks-ユニットテスト)
  - [対象](#対象-1)
  - [モック方針](#モック方針-1)
  - [テストケース一覧](#テストケース一覧-1)
    - [usePagination](#usepagination)
    - [useReportForm](#usereportform)
    - [useLoginForm](#useloginform)
    - [useLoading（+ LoadingContext）](#useloading-loadingcontext)
    - [useReport](#usereport)
- [テスト設計: ConfirmationModal コンポーネント](#テスト設計-confirmationmodal-コンポーネント)
  - [対象](#対象-2)
  - [モック方針](#モック方針-2)
  - [テストケース一覧](#テストケース一覧-2)
    - [正常系](#正常系-5)
    - [準正常系](#準正常系-4)
    - [異常系](#異常系-4)
- [テスト設計: E2E テスト強化](#テスト設計-e2e-テスト強化)
  - [対象](#対象-3)
  - [方針](#方針)
  - [ヘルパー分離設計](#ヘルパー分離設計)
  - [新規テストケース一覧](#新規テストケース一覧)
    - [準正常系（既存テストの強化）](#準正常系既存テストの強化)
    - [異常系（新規）](#異常系新規)
    - [構成変更（リファクタリング）](#構成変更リファクタリング)
  - [既存テスト（TC-026〜TC-030）のステータス](#既存テストtc-026tc-030のステータス)

## 前提データ作成方針
- テスト実行前に初期データを用意できる仕組みを持つ（fixture/seedなど）。
- ログイン済/未ログインの状態を切り替えられる手段を用意する。
- 「レポート0件」ケースはデータ初期化で再現する。

## 実行方法
- 初回のみ: `cd front && pnpm exec playwright install`
- `cd front && pnpm test:e2e`
- UIモード: `cd front && pnpm test:e2e:ui`
- レポート表示: `cd front && pnpm test:e2e:report`
- 既存サーバーを使う場合: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:e2e`

## CI（GitHub Actions）
- `front/playwright.config.ts` により、CIでは `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で起動する。
- Supabaseクライアント初期化のため、CIでは `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` をダミー値で渡す。

## テストデータ注入
- 各テストで `localStorage` の `espresso_reports` / `espresso_user` を初期化して前提状態を作成する。
- E2E実行時は `NEXT_PUBLIC_AUTH_MODE=local` を使い、Authをローカルモードで動作させる。
- E2E実行時は `NEXT_PUBLIC_DATA_MODE=local` を使い、Reportデータをローカルモードで動作させる。

## 現行の自動テスト実装範囲
- 実装ファイル: `front/tests/e2e/app.spec.ts`
- 共有ヘルパー: `front/tests/e2e/helpers.ts`（fixture データ・setStorage を分離）
- カバー済み: TC-001 〜 TC-031, TC-035, TC-036
- 未実装: TC-008-2（許可メール不一致）

## 画面×観点マトリクス（前提/手順/期待）

### 一覧（/）
- 表示
  - 前提: レポートが1件以上ある
  - 手順: `/` を開く
  - 期待: カードにカテゴリ/日付/タイトル/要約/著者が表示
- フィルタ（カテゴリ）
  - 前提: 複数カテゴリのレポートが存在
  - 手順: サイドバーのカテゴリをクリック
  - 期待: 一覧が該当カテゴリのみ表示、再クリックで解除
- フィルタ（タグ）
  - 前提: 複数タグのレポートが存在
  - 手順: サイドバーのタグをクリック
  - 期待: 一覧が該当タグのみ表示、再クリックで解除
- 空表示
  - 前提: レポート0件
  - 手順: `/` を開く
  - 期待: “No reports found.” が表示
- 遷移
  - 前提: レポートが存在
  - 手順: カードのタイトル or “Read Report” をクリック
  - 期待: `/report/:id` に遷移
- ページング
  - 前提: レポートが11件以上存在
  - 手順: 「前へ」「次へ」またはページ番号を操作
  - 期待: 1ページ10件で表示、ページ番号は最大5個表示、フィルタ変更時は1ページ目に戻る

### 詳細（/report/:id）
- 表示
  - 前提: 該当IDが存在
  - 手順: `/report/:id` を開く
  - 期待: タイトル/著者/日付/カテゴリ/本文/タグが表示
- 編集導線
  - 前提: ログイン済
  - 手順: 詳細を開く
  - 期待: 「編集」「削除」ボタンが表示
- 未ログイン導線非表示
  - 前提: 未ログイン
  - 手順: 詳細を開く
  - 期待: 編集/削除ボタンは表示されない
- 404相当
  - 前提: 存在しないID
  - 手順: `/report/unknown`
  - 期待: “Report Not Found”

### 新規作成（/report/new）
- アクセス制御
  - 前提: 未ログイン
  - 手順: `/report/new` 直アクセス
  - 期待: `/login` にリダイレクト
- 必須入力
  - 前提: ログイン済
  - 手順: タイトル/本文/カテゴリ/著者/タグ未入力で送信
  - 期待: 送信できない/バリデーション表示
- 確認モーダル
  - 前提: ログイン済
  - 手順: 必須入力 → 送信
  - 期待: 確認モーダルが表示
- 成功
  - 前提: ログイン済
  - 手順: 確認 → 投稿
  - 期待: 一覧先頭に追加される

### 編集（/report/:id/edit）
- アクセス制御
  - 前提: 未ログイン
  - 手順: `/report/:id/edit` 直アクセス
  - 期待: `/login` にリダイレクト
- 既存データ反映
  - 前提: ログイン済、既存レポートあり
  - 手順: 編集画面を開く
  - 期待: 既存値がフォームに入っている
- 確認モーダル
  - 前提: ログイン済
  - 手順: 更新 → 確認
  - 期待: モーダルが表示
- 成功
  - 前提: ログイン済
  - 手順: 更新確定
  - 期待: 詳細に反映される

### ログイン（/login）
- 入力必須
  - 前提: 未ログイン
  - 手順: 空入力で送信
  - 期待: 認証不可/遷移なし
- 成功
  - 前提: 未ログイン
  - 手順: ユーザー名/パスワード入力 → 送信
  - 期待: `/` に遷移、ヘッダーにユーザー表示
- 失敗（許可メール不一致）
  - 前提: 未ログイン
  - 手順: 許可外メールでログイン
  - 期待: エラーメッセージ表示、ログイン不可

### 削除/ログアウト
- 削除確認
  - 前提: ログイン済
  - 手順: 詳細で削除 → モーダル
  - 期待: 取消で削除されない / 確定で削除
- ログアウト
  - 前提: ログイン済
  - 手順: Logout
  - 期待: `/login` に遷移、管理導線非表示

### Markdown Style Lab（/report/markdown-lab）
- アクセス制御
  - 前提: 未ログイン
  - 手順: `/report/markdown-lab` 直アクセス
  - 期待: `/login` にリダイレクト
- メニュー導線
  - 前提: ログイン済
  - 手順: ヘッダーの「Markdown Lab」をクリック
  - 期待: `/report/markdown-lab` に遷移し、Lab画面が表示

## 詳細テストケース（ID/前提/手順/期待）

- TC-001 正常: 一覧表示
  - 前提: レポート1件以上
  - 手順: `/` を開く
  - 期待: カードにカテゴリ/日付/タイトル/要約/著者が表示

- TC-002 正常: 一覧→詳細遷移
  - 前提: レポートが存在
  - 手順: タイトル or “Read Report” クリック
  - 期待: `/report/:id` へ遷移

- TC-003 異常: 一覧0件
  - 前提: レポート0件
  - 手順: `/` を開く
  - 期待: “No reports found.” 表示

- TC-003-2 正常: カテゴリフィルタ
  - 前提: 複数カテゴリのレポートが存在
  - 手順: サイドバーのカテゴリをクリック
  - 期待: 該当カテゴリのみ表示、再クリックで解除

- TC-003-3 正常: タグフィルタ
  - 前提: 複数タグのレポートが存在
  - 手順: サイドバーのタグをクリック
  - 期待: 該当タグのみ表示、再クリックで解除

- TC-004 正常: 詳細表示
  - 前提: 該当IDが存在
  - 手順: `/report/:id` を開く
  - 期待: タイトル/著者/日付/本文/タグが表示

- TC-005 異常: 詳細ID不正
  - 前提: 存在しないID
  - 手順: `/report/unknown`
  - 期待: “Report Not Found”

- TC-006 準正常: 未ログインで編集導線なし
  - 前提: 未ログイン、ID存在
  - 手順: `/report/:id`
  - 期待: 編集/削除ボタン非表示

- TC-007 正常: ログイン成功
  - 前提: 未ログイン
  - 手順: `/login` → ユーザー名/パスワード入力 → 送信
  - 期待: `/` に遷移、ヘッダーにユーザー/Logout表示

- TC-008 異常: ログイン空入力
  - 前提: 未ログイン
  - 手順: 空入力で送信
  - 期待: 認証不可/遷移なし

- TC-008-2 異常: 許可メール不一致
  - 前提: 未ログイン
  - 手順: 許可外メールでログイン
  - 期待: エラーメッセージ表示、ログイン不可

- TC-009 異常: 未ログインで新規作成直アクセス
  - 前提: 未ログイン
  - 手順: `/report/new`
  - 期待: `/login` にリダイレクト

- TC-010 異常: 未ログインで編集直アクセス
  - 前提: 未ログイン
  - 手順: `/report/:id/edit`
  - 期待: `/login` にリダイレクト

- TC-011 正常: 新規作成→確認→投稿
  - 前提: ログイン済
  - 手順: 必須項目入力 → 送信 → 確認
  - 期待: 一覧先頭に追加

- TC-012 異常: 新規作成必須未入力
  - 前提: ログイン済
  - 手順: タイトル/要約/本文未入力で送信
  - 期待: 送信不可/エラーメッセージ

- TC-013 異常: タグ未入力
  - 前提: ログイン済
  - 手順: タグ未入力で投稿
  - 期待: 送信不可/バリデーション表示

- TC-014 準正常: タグ正規化
  - 前提: ログイン済
  - 手順: `a, b, #c` を入力し投稿
  - 期待: `#a #b #c` に正規化

- TC-015 正常: 編集初期値反映
  - 前提: ログイン済、既存レポート
  - 手順: `/report/:id/edit`
  - 期待: フォームに既存値が入る

- TC-016 正常: 編集→確認→反映
  - 前提: ログイン済
  - 手順: 内容編集 → 送信 → 確認
  - 期待: 詳細に反映

- TC-017 準正常: 編集で本文のみ変更
  - 前提: ログイン済
  - 手順: 本文のみ変更して保存
  - 期待: 他項目は保持

- TC-018 正常: 削除キャンセル
  - 前提: ログイン済
  - 手順: 削除 → モーダルでキャンセル
  - 期待: 削除されない

- TC-019 正常: 削除確定
  - 前提: ログイン済
  - 手順: 削除 → モーダルで確定
  - 期待: 一覧から消える

- TC-020 正常: ログアウト
  - 前提: ログイン済
  - 手順: Logout
  - 期待: `/login` に遷移、管理導線非表示

- TC-021 異常: 未ログインでMarkdown Style Lab直アクセス
  - 前提: 未ログイン
  - 手順: `/report/markdown-lab`
  - 期待: `/login` にリダイレクト

- TC-022 正常: ログイン時にMarkdown Lab導線を利用可能
  - 前提: ログイン済
  - 手順: ヘッダーの「Markdown Lab」をクリック
  - 期待: `/report/markdown-lab` に遷移し、Pattern 07 の表示を確認できる

- TC-023 正常: 一覧ページング（10件表示 + 前へ/次へ）
  - 前提: レポートが11件以上存在
  - 手順: `/` を開き「次へ」→「前へ」を操作
  - 期待: 1ページ10件表示、2ページ目に遷移でき、「前へ」で1ページ目に戻る

- TC-024 正常: ページ番号ボタン上限（最大5）
  - 前提: レポートが51件以上存在
  - 手順: `/` を開きページ番号/「次へ」を操作
  - 期待: ページ番号ボタンは常に最大5個、最終ページでは「次へ」が無効

- TC-025 正常: フィルタ変更時のページリセット
  - 前提: ページング対象件数のレポートが存在
  - 手順: 2ページ目へ移動後にカテゴリフィルタを適用
  - 期待: 1ページ目へ自動で戻り、フィルタ結果の先頭10件が表示される

### 外部URL管理（詳細: `docs/03-functional-specification.md`）

- TC-026 正常: URL 0件の詳細表示
  - 前提: URLが紐付いていないレポート
  - 手順: 詳細画面を開く
  - 期待: 外部リンクセクションが表示されない

- TC-027 正常: URL複数件の詳細表示
  - 前提: URL 2件以上が紐付いたレポート（ラベルあり / なし混在）
  - 手順: 詳細画面を開く
  - 期待: 全URLがクリッカブルリンクとして表示される。ラベルありはラベル表示、ラベルなしはURL表示

- TC-028 正常: 新規作成でURL追加
  - 前提: ログイン済
  - 手順: 新規作成 → URL 2件追加（1件はラベルあり、1件はラベルなし） → 投稿
  - 期待: 詳細画面で2件のリンクが表示される

- TC-029 正常: 編集でURL追加・削除
  - 前提: ログイン済、URL 1件紐付きのレポート
  - 手順: 編集画面を開く → 既存URL 1件を確認 → 新規URL 1件追加 → 既存URL 1件削除 → 保存
  - 期待: 詳細画面で新しいURL 1件のみ表示される

- TC-030 異常: 不正URL入力
  - 前提: ログイン済
  - 手順: URL欄に URL形式でない文字列を入力して投稿
  - 期待: 該当行にバリデーションエラー表示、送信不可

### 追加テストケース（二重送信防止・エッジケース）

- TC-031 準正常: 投稿確認モーダルの二重クリック防止
  - 前提: ログイン済
  - 手順: 新規作成 → 確認 → 投稿ボタンをクリック
  - 期待: レポートが1件だけ作成される（重複なし）

- TC-035 異常: 数値型の存在しないレポートID
  - 前提: —
  - 手順: `/report/99999` に直アクセス
  - 期待: "Report Not Found" 表示

- TC-036 準正常: 空の外部URL行は無視される
  - 前提: ログイン済
  - 手順: URL追加 → 1行目空のまま、2行目に有効URL → 投稿
  - 期待: 空行は無視され、有効URLのみ保存・表示される

---

# テスト設計（ユニット / E2E強化）

> 以下は旧 `docs/test-design/` を統合したテスト設計の詳細（validation / hooks / modal / E2E強化）。

---

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

---

# テスト設計: hooks ユニットテスト

## 対象

- 対象機能: カスタムフック（ページネーション、レポートフォーム、ログインフォーム、ローディング、レポート取得）
- 対象ファイル:
  - `front/src/hooks/usePagination.ts`
  - `front/src/hooks/useReportForm.ts`
  - `front/src/hooks/useLoginForm.ts`
  - `front/src/hooks/useLoading.ts`（+ `front/src/providers/LoadingContext.tsx`）
  - `front/src/hooks/useReport.ts`
- スタック: Frontend (Next.js 16 / Vitest + @testing-library/react)

## モック方針

- モック許可: `next/navigation`（useRouter）、`fetch`（API呼び出し）、`process.env`
- モック禁止: usePagination 内部ロジック、バリデーション関数

---

## テストケース一覧

### usePagination

テストファイル: `front/src/hooks/__tests__/usePagination.test.ts`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| P-N-1 | 基本的なページ計算 | totalItems=25, filterKey="all" | totalPages=3, currentPage=1 | High |
| P-N-2 | updatePage で2ページ目に遷移 | updatePage(2) | currentPage=2 | High |
| P-N-3 | ページ番号配列が最大5個 | totalItems=100 | pageNumbers.length <= 5 | High |
| P-N-4 | paginateSlice で正しいスライス | 20件の配列、currentPage=2 | index 10-19 の10件 | High |
| P-N-5 | 中央ページでのウィンドウスライド | totalItems=100, page=5 | pageNumbers が [3,4,5,6,7] | Medium |
| P-N-6 | 最終ページ付近のウィンドウ固定 | totalItems=100, page=10 | pageNumbers が [6,7,8,9,10] | Medium |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| P-S-1 | totalItems=0 で totalPages=1 | totalItems=0 | totalPages=1, currentPage=1 | High |
| P-S-2 | filterKey 変更でページ1にリセット | filterKey を "AI" → "Cloud" に変更 | currentPage=1 | High |
| P-S-3 | 範囲外ページ指定はクランプ | updatePage(999) (totalPages=3) | currentPage=3 | Medium |
| P-S-4 | updatePage(0) は 1 にクランプ | updatePage(0) | currentPage=1 | Medium |
| P-S-5 | totalItems 減少で currentPage が自動調整 | page=5 → totalItems が 30 に減少 | currentPage=3（safeTotalPages） | Medium |

#### 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| P-A-1 | 負の totalItems | totalItems=-1 | totalPages=1, クラッシュしない | Low |

---

### useReportForm

テストファイル: `front/src/hooks/__tests__/useReportForm.test.ts`

モック: `next/navigation` の `useRouter`（push, back）、`onSubmit` コールバック

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| RF-N-1 | 新規作成モードの初期値 | user あり、reportId なし | formData.category === CATEGORIES[0], author === user.username | High |
| RF-N-2 | 編集モードで既存値がセット | reportId + reports にマッチあり | formData に既存値が反映 | High |
| RF-N-3 | handleChange でフォーム値更新 | name="title", value="New" | formData.title === "New" | High |
| RF-N-4 | handleTagsChange でタグ正規化 | "ai, cloud" | formData.tags === ["#ai", "#cloud"] | High |
| RF-N-5 | handleSubmitAttempt で確認モーダル表示 | tags あり | showConfirmModal === true | High |
| RF-N-6 | handleConfirmSubmit で onSubmit 呼び出し | onSubmit が { ok: true } を返す | onSubmit が呼ばれる | High |
| RF-N-7 | externalUrls の追加/更新/削除 | addExternalUrl → updateExternalUrl → removeExternalUrl | externalUrls 配列が正しく更新 | High |
| RF-N-8 | 編集モードで externalUrls が初期セット | 既存レポートに externalUrls あり | externalUrls に既存値が入る | Medium |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| RF-S-1 | user null で /login にリダイレクト | user: null | router.push("/login") | High |
| RF-S-2 | tags 空で送信するとエラー | tags: [] → handleSubmitAttempt | tagError === "タグを入力してください。" | High |
| RF-S-3 | tags 入力後にエラーがクリア | tagError あり → tags 入力 | tagError === null | Medium |
| RF-S-4 | handleChange 時に該当 fieldError がクリア | fieldErrors に title あり → title 変更 | fieldErrors.title なし | Medium |
| RF-S-5 | 不正 externalUrl でバリデーションエラー | url: "not-a-url" → handleConfirmSubmit | fieldErrors に externalUrls.0.url | High |
| RF-S-6 | onSubmit が 401 を返すと /login リダイレクト | onSubmit → { ok: false, status: 401 } | router.push("/login") | High |
| RF-S-7 | onSubmit が fieldErrors を返すとセット | onSubmit → { ok: false, fieldErrors: {...} } | fieldErrors がセットされる | Medium |
| RF-S-8 | onSubmit がエラー文字列を返すとセット | onSubmit → { ok: false, error: "Server Error" } | serverError === "Server Error" | Medium |
| RF-S-9 | removeExternalUrl 後に fieldErrors のインデックスが再採番 | 3件中 index=1 を削除 | externalUrls.2.url → externalUrls.1.url に振り直し | Medium |

#### 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| RF-A-1 | onSubmit が 403 を返すと /login リダイレクト | status: 403 | router.push("/login") | Medium |
| RF-A-2 | isHydrated=false で useEffect がスキップ | isHydrated: false | router.push 呼ばれない、formData 未変更 | Low |

---

### useLoginForm

テストファイル: `front/src/hooks/__tests__/useLoginForm.test.ts`

モック: `onLogin`、`onLoginWithGoogle` コールバック、`window.location.search`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| LF-N-1 | 初期状態 | — | email="", password="", error=null, isSubmitting=false | High |
| LF-N-2 | handleSubmit で onLogin 呼び出し | email+password 入力 → submit | onLogin(email, password) が呼ばれる | High |
| LF-N-3 | ログイン成功で isSubmitting 維持 | onLogin → null を返す | isSubmitting === true（遷移待ち） | Medium |
| LF-N-4 | handleGoogleLogin で onLoginWithGoogle 呼び出し | — | onLoginWithGoogle が呼ばれ、isSubmitting=true | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| LF-S-1 | email/password 空で submit しても onLogin 呼ばれない | email="", password="" | onLogin 未呼び出し | High |
| LF-S-2 | onLogin がエラー文字列を返す | onLogin → "認証失敗" | error === "認証失敗", isSubmitting=false | High |
| LF-S-3 | URL に ?error=unauthorized がある場合 | window.location.search = "?error=unauthorized" | error === "許可されていないメールアドレスです。" | High |
| LF-S-4 | Google ログイン失敗 | onLoginWithGoogle → "エラー" | error === "エラー", isSubmitting=false | Medium |

#### 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| LF-A-1 | onLogin が例外を投げた場合 | onLogin → throw Error | クラッシュしない（Promise.then で処理） | Low |

---

### useLoading（+ LoadingContext）

テストファイル: `front/src/hooks/__tests__/useLoading.test.ts`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| L-N-1 | LoadingProvider 内で startLoading が呼べる | Provider でラップ | startLoading が provider の値を呼ぶ | High |
| L-N-2 | Provider 外で no-op fallback | Provider 外で useLoading | startLoading() が例外なく呼べる | High |

---

### useReport

テストファイル: `front/src/hooks/__tests__/useReport.test.ts`

モック: `fetch`、`process.env.NEXT_PUBLIC_DATA_MODE`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| R-N-1 | ローカルモードで listReport をそのまま返す | dataMode="local", listReport あり | report === listReport, fetch 未呼び出し | High |
| R-N-2 | listReport に content がある場合 fetch しない | listReport.content あり | fetch 未呼び出し | Medium |
| R-N-3 | supabase モードで API から取得 | dataMode="supabase", listReport.content なし | fetch("/api/reports/xxx") が呼ばれ、結果がセット | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| R-S-1 | reportId が undefined の場合 | reportId: undefined | fetch 未呼び出し、report は listReport のまま | Medium |
| R-S-2 | API が非 200 を返す | fetch → { ok: false } | report は listReport のまま（undefined にならない） | Medium |

#### 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| R-A-1 | fetch が例外 | fetch → throw Error | クラッシュしない、isLoading=false に戻る | Medium |

---

# テスト設計: ConfirmationModal コンポーネント

## 対象

- 対象機能: 確認モーダル（投稿/編集/削除の確認ダイアログ）
- 対象ファイル: `front/src/components/organisms/ConfirmationModal.tsx`
- スタック: Frontend (Next.js 16 / Vitest + @testing-library/react)
- テストファイル: `front/src/components/__tests__/ConfirmationModal.test.tsx`

## モック方針

- モック不要（DOM のみで完結するコンポーネント）
- `theme` は ESPRESSO_THEME を直接使用

---

## テストケース一覧

### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| M-N-1 | isOpen=true でモーダルが描画 | isOpen: true | title, message, confirmLabel が表示 | High |
| M-N-2 | isOpen=false で何も描画しない | isOpen: false | DOM にモーダル要素なし | High |
| M-N-3 | 確認ボタンクリックで onConfirm → onClose | ユーザーが確認ボタンをクリック | onConfirm と onClose が順に呼ばれる | High |
| M-N-4 | キャンセルボタンで onClose のみ | ユーザーがキャンセルをクリック | onClose が呼ばれ、onConfirm は呼ばれない | High |
| M-N-5 | confirmVariant="danger" で赤背景 | confirmVariant: "danger" | 確認ボタンに bg-red-800 クラス | Medium |
| M-N-6 | confirmVariant="primary" でアクセント背景 | confirmVariant: "primary" | 確認ボタンにアクセントクラス | Medium |

### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| M-S-1 | 処理中は確認ボタンが disabled + "処理中..." 表示 | onConfirm が Promise（未解決） | ボタン disabled、テキストが "処理中..." | High |
| M-S-2 | 処理中はキャンセルボタンも disabled | onConfirm 実行中 | キャンセルボタン disabled | High |
| M-S-3 | 二重クリック防止 | 確認ボタンを連続クリック | onConfirm は1回だけ呼ばれる | High |
| M-S-4 | モーダル内部クリックで閉じない | モーダル内の div をクリック | onClose は呼ばれない（event.stopPropagation） | Medium |

### 異常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| M-A-1 | onConfirm が例外を投げた場合 | onConfirm → throw Error | isSubmitting が false に戻る（finally）、onClose は呼ばれない | High |
| M-A-2 | 例外後にボタンが再度有効になる | onConfirm → throw → 再クリック | ボタンが再度 enabled に戻り操作可能 | Medium |

---

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
