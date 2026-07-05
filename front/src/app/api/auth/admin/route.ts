import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * リクエスト元が管理者かどうかを判定する（Supabase 認証モード用）。
 *
 * Authorization ヘッダの Bearer トークンで Supabase ユーザーを解決し、
 * そのメールアドレスを `ADMIN_EMAIL`（カンマ区切り・大小無視）と照合する。
 * 管理者判定はサーバー専用の `ADMIN_EMAIL` で行い、クライアントには公開しない。
 *
 * @param request - 受信リクエスト（Authorization ヘッダの Bearer トークンを参照）
 * @returns 判定結果 `{ isAdmin }` の JSON。トークン欠如・検証失敗時は 401 で `{ isAdmin: false }`
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!authHeader || !token) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const email = data.user.email ?? '';
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(email.toLowerCase());

  return NextResponse.json({ isAdmin });
}
