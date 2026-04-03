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
