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
