// クライアント（ブラウザ）側の Supabase シングルトン。
// anon key のみを使い、認証セッション管理（getSession / signInWithOAuth 等）に用いる。
// サーバー側の管理者判定は別モジュール（`auth-server.ts`）が担う。

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// env 未設定でも import 時に throw せず警告に留める。
// CI/ビルドはダミー値で動かす方針（`.claude/rules/environment.md`）のため、
// 実行時まで失敗を遅延させて開発体験を損なわないようにする。
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Check NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.');
}

/** ブラウザ用 Supabase クライアント（anon key・認証セッション用のシングルトン）。 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
