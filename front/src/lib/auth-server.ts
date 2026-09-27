// 書き込み系 API の管理者ゲート。Route Handler から `requireAdmin()` を呼び、
// Bearer トークンを Supabase で検証したうえで `ADMIN_EMAIL` 許可リストと照合する。
// RLS と合わせた二重防御の「アプリ側」を担う（`.claude/rules/security.md`）。

// Client Component から誤って import されたらビルドを失敗させる。
// このモジュールは `ADMIN_EMAIL` を読むため、クライアントに引き込むと許可リストが露出する。
import 'server-only';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/** 認可結果。成功時は管理者メール、失敗時は返すべき HTTP レスポンスを含む。 */
type RequireAdminResult = { ok: true; email: string } | { ok: false; response: NextResponse };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// サーバー側でトークン検証に使う Supabase クライアント（モジュールスコープで 1 度だけ生成）。
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// 検証済みトークンをメモリにキャッシュする（ウォーム起動をまたいで生存する）。
// 同一トークンの 2 回目以降は Supabase への HTTP 往復を省き、レイテンシを削減する。
// キーはトークンの SHA-256。メモリ上でもトークン本体を保持し続けない（Issue #208）。
// `expiresAt` はトークン自身の `exp` を超えない（失効したトークンをキャッシュで通さない）。
const authCache = new Map<string, { email: string; expiresAt: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 分

/** JWT の payload のうち、キャッシュ期限の算出に使う部分。`exp` は UNIX 秒 */
const jwtExpirySchema = z.object({ exp: z.number().finite() });

/**
 * キャッシュのキーにするため、トークンを SHA-256 のハッシュ値に変換する。
 *
 * @param token - Bearer トークン
 * @returns 16 進表記のハッシュ値
 */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * JWT の payload から有効期限（`exp`）を読み取る。
 *
 * **署名は検証しない。** Supabase の `getUser()` で検証が成功した後にだけ呼び、
 * キャッシュ期限の上限を決める用途に限る（`exp` を認可判断そのものには使わない）。
 *
 * @param token - Bearer トークン（Supabase のアクセストークン = JWT）
 * @returns 有効期限（UNIX ミリ秒）。JWT でない・`exp` が無い・壊れている場合は `null`
 */
const readTokenExpiryMs = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const parsed = jwtExpirySchema.safeParse(
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
    );
    return parsed.success ? parsed.data.exp * 1000 : null;
  } catch {
    return null;
  }
};

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
  const cacheKey = hashToken(token);
  const cached = authCache.get(cacheKey);
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

  // 検証成功をキャッシュする。期限は「5 分後」と「トークンの exp」の早い方。
  // exp が読めないトークンは期限の上限が分からないためキャッシュせず、毎回 Supabase で検証する。
  const tokenExpiresAt = readTokenExpiryMs(token);
  if (tokenExpiresAt !== null) {
    const expiresAt = Math.min(Date.now() + AUTH_CACHE_TTL, tokenExpiresAt);
    if (expiresAt > Date.now()) authCache.set(cacheKey, { email, expiresAt });
  }

  // メモリリーク防止のため、一定サイズを超えたら期限切れエントリを掃除する。
  if (authCache.size > 100) {
    const now = Date.now();
    for (const [key, val] of authCache) {
      if (val.expiresAt <= now) authCache.delete(key);
    }
  }

  return { ok: true, email };
};
