/**
 * 認証済みユーザー。
 *
 * 管理者判定はサーバー API（`/api/auth/admin`）が `ADMIN_EMAIL` と照合した結果を
 * `role` に反映する。クライアント側で `role` を書き換えても権限は付与されない
 * （実際の認可はサーバーで行う）。
 */
export interface User {
  /** ユーザー識別子（Supabase Auth の UID）。 */
  id: string;
  /** 表示名。 */
  username: string;
  /** メールアドレス。管理者判定に使うが取得できない場合は未設定。 */
  email?: string;
  /** 権限ロール。`admin` は編集・削除等の管理操作が可能。 */
  role: 'admin' | 'user';
}
