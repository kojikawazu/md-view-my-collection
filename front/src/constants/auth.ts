/**
 * 認証済みフラグ Cookie の名前。
 *
 * ログイン成功時にクライアントが `=1` を書き込み、ログアウトで破棄する。
 * Supabase のセッションはクライアント側に載りサーバーからは見えないため、
 * Server Component（`report/markdown-lab/layout.tsx`）が認証状態を判断できるよう、
 * サーバーからも読めるこの Cookie を「サーバー可視の認証フラグ」として橋渡しに使う。
 */
export const AUTH_COOKIE_NAME = 'report_viewer_auth';
