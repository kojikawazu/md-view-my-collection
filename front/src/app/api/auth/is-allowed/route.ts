import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

/** 許可判定 API のレスポンス形式（許可されていれば `allowed: true`）。 */
type AllowedResponse = {
  allowed: boolean;
};

/**
 * 許可メール一覧を `ADMIN_EMAIL` から取得する。
 *
 * カンマ区切りを分解し、前後空白除去・小文字化・空要素除去を行い比較用に正規化する。
 *
 * @returns 正規化済みの許可メールアドレス配列
 */
const getAllowedEmails = () =>
  (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/**
 * 指定メールが許可リストに含まれるかを判定する。
 *
 * メール未指定・許可リスト空はいずれも不許可扱い（フェイルクローズ）とする。
 *
 * @param email - 判定対象のメールアドレス（null/undefined 可）
 * @returns 許可リストに含まれれば `true`、それ以外は `false`
 */
const isAllowedEmail = (email: string | null | undefined) => {
  const allowedEmails = getAllowedEmails();
  if (!email || allowedEmails.length === 0) return false;
  return allowedEmails.includes(email.toLowerCase());
};

/**
 * Authorization ヘッダから Bearer トークンを取り出す。
 *
 * `Bearer ` 接頭辞が無い、またはトークンが空の場合は null を返す。
 *
 * @param request - 受信リクエスト（Authorization ヘッダを参照）
 * @returns 抽出したアクセストークン。取得できなければ null
 */
const extractBearerToken = (request: NextRequest) => {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
};

/**
 * ログイン許可対象のメールかを判定する。認証モードで検証方法が変わる。
 *
 * - local モード（E2E 専用）: リクエストボディの `email` を許可リストと照合する。
 * - supabase モード（本番）: Bearer トークンで Supabase ユーザーを解決し、そのメールを照合する。
 *
 * 許可リストに載っているメールを総当たりで**列挙**されないよう、判定より前にレートリミットを
 * 適用する（`docs/06-security-specification.md`）。
 *
 * @param request - 受信リクエスト（local はボディ、supabase は Authorization ヘッダを参照）
 * @returns 判定結果 `{ allowed }` の JSON。トークン欠如・検証失敗時は 401、Supabase 環境変数不足時は 500、上限超過時は 429
 */
export async function POST(request: NextRequest) {
  const limit = await checkRateLimit('auth-is-allowed', request);
  if (!limit.allowed) return rateLimitResponse(limit);

  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';

  if (authMode === 'local') {
    const body = (await request.json().catch(() => ({}))) as { email?: string | null };
    return NextResponse.json<AllowedResponse>({ allowed: isAllowedEmail(body.email) });
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth] missing supabase env for admin email check');
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    console.error('[auth] failed to verify access token', error.message);
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 401 });
  }

  return NextResponse.json<AllowedResponse>({
    allowed: isAllowedEmail(data.user?.email),
  });
}
