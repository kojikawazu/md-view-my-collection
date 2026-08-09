/**
 * 作成・更新・削除など mutation 系操作の結果。
 *
 * 判別可能ユニオン。`ok` で成否を分岐し、失敗時のみ HTTP ステータスと
 * エラー内容を持つ。`fieldErrors` はバリデーション失敗時のフィールド別
 * メッセージ（フィールド名 → 日本語メッセージ）で、フォームの各入力欄に
 * エラーを紐付けるために使う。
 */
export type MutationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };
