// 認証・認可判定（`/api/auth/*`）へのアクセス。
// `ADMIN_EMAIL` はサーバー専用のため、許可判定は必ず API 越しに行う（秘匿値をクライアントへ出さない）。

import { requestJson } from '@/repositories/client';

/**
 * メールアドレスが許可リストに含まれるかをサーバーへ問い合わせる（local モード用）。
 *
 * local モードは Supabase セッションを持たないため、メールを body で送って照合する。
 *
 * @param email - 判定対象のメールアドレス。未入力時は null
 * @returns 許可メールなら true
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchIsAllowedEmail = async (email: string | null): Promise<boolean> => {
  const result = await requestJson<{ allowed?: boolean }>('/api/auth/is-allowed', {
    method: 'POST',
    body: { email },
  });
  return Boolean(result.allowed);
};

/**
 * Bearer トークンの持ち主が管理者かをサーバーへ問い合わせる（supabase モード用）。
 *
 * メールをクライアントから送らずに済ませるため、トークンのみで判定する。
 * 非管理者でも 200 で `isAdmin: false` が返る（`docs/07-api-specification.md` DJ-7）。
 *
 * @param token - Supabase セッションのアクセストークン
 * @returns 管理者なら true
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchIsAdmin = async (token: string): Promise<boolean> => {
  const result = await requestJson<{ isAdmin?: boolean }>('/api/auth/admin', { token });
  return Boolean(result.isAdmin);
};
