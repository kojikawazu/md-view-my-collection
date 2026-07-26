// 書き込み系 API の管理者ゲート。Route Handler から `requireAdmin()` を呼び、
// Bearer トークンを Supabase で検証したうえで `ADMIN_EMAIL` 許可リストと照合する。
// RLS と合わせた二重防御の「アプリ側」を担う（`.claude/rules/security.md`）。

// Client Component から誤って import されたらビルドを失敗させる。
// このモジュールは `ADMIN_EMAIL` を読むため、クライアントに引き込むと許可リストが露出する。
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** 認可結果。成功時は管理者メール、失敗時は返すべき HTTP レスポンスを含む。 */
type RequireAdminResult = { ok: true; email: string } | { ok: false; response: NextResponse };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// サーバー側でトークン検証に使う Supabase クライアント（モジュールスコープで 1 度だけ生成）。
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// 検証済みトークンをメモリにキャッシュする（ウォーム起動をまたいで生存する）。
// 同一トークンの 2 回目以降は Supabase への HTTP 往復を省き、レイテンシを削減する。
const authCache = new Map<string, { email: string; expiresAt: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 分

/**
 * ログ出力用にメールを部分マスクする。
 *
 * ログにメールアドレス（センシティブ情報）を平文で残さないための措置
 * （`.claude/rules/error-handling.md`）。先頭 1 文字とドメインのみ残す。
 *
 * @param value マスク対象のメールアドレス
 * @returns `a***@example.com` 形式のマスク文字列。空や短すぎる場合は `''` / `'***'`
 */
const maskEmail = (value: string) => {
  if (!value) return '';
  const at = value.indexOf('@');
  if (at <= 1) return '***';
  return `${value[0]}***@${value.slice(at + 1)}`;
};

/**
 * リクエストが管理者によるものかを検証する認可ガード。
 *
 * `Authorization: Bearer <token>` を取り出し、キャッシュヒット時はそれで即判定、
 * 未ヒット時は Supabase でトークンを検証してメールを取得し、`ADMIN_EMAIL`（カンマ区切り）と照合する。
 * 認証失敗・トークン欠落・非管理者はそれぞれ 401/403 のレスポンスを `response` に載せて返す
 * （呼び出し側はそのまま return できる）。
 *
 * @param request 検証対象のリクエスト（Authorization ヘッダを参照）
 * @param context ログに付与する呼び出し元識別子（例: エンドポイント名）
 * @returns 成功時は `{ ok: true, email }`、失敗時は `{ ok: false, response }`
 */
export const requireAdmin = async (
  request: NextRequest,
  context: string,
): Promise<RequireAdminResult> => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!authHeader || !token) {
    console.warn(`[${context}] auth header missing`);
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // まずメモリキャッシュを確認する（Supabase への HTTP 往復を省く）。
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    if (adminEmails.includes(cached.email.toLowerCase())) {
      return { ok: true, email: cached.email };
    }
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const email = authData?.user?.email ?? '';
  const emailMatches = adminEmails.includes(email.toLowerCase());

  if (authError || adminEmails.length === 0 || !emailMatches) {
    console.warn(`[${context}] auth check failed`, {
      hasAuthError: Boolean(authError),
      emailMasked: maskEmail(email),
      emailMatches,
    });
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  // 検証成功をキャッシュする。
  authCache.set(token, { email, expiresAt: Date.now() + AUTH_CACHE_TTL });

  // メモリリーク防止のため、一定サイズを超えたら期限切れエントリを掃除する。
  if (authCache.size > 100) {
    const now = Date.now();
    for (const [key, val] of authCache) {
      if (val.expiresAt <= now) authCache.delete(key);
    }
  }

  return { ok: true, email };
};
