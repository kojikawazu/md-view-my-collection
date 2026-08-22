/**
 * 認証済みフラグ Cookie の名前。
 *
 * ログイン成功時にクライアントが `=1` を書き込み、ログアウトで破棄する。
 * Supabase のセッションはクライアント側に載りサーバーからは見えないため、
 * Server Component（`report/markdown-lab/layout.tsx`）が認証状態を判断できるよう、
 * サーバーからも読めるこの Cookie を「サーバー可視の認証フラグ」として橋渡しに使う。
 */
export const AUTH_COOKIE_NAME = 'report_viewer_auth';

/**
 * レートリミット超過時に利用者へ見せる文言。
 *
 * API の 429 応答本文（`lib/rate-limit.ts`）と画面表示（ログイン画面・セッション復元）で
 * **同じ文字列を共有する**。信頼境界をまたぐため検証自体は両側で行うが、文言まで二重に
 * 持つと片方だけ直る（`.claude/rules/duplication.md`）。
 */
export const RATE_LIMIT_MESSAGE = 'リクエストが多すぎます。時間をおいて再試行してください。';
