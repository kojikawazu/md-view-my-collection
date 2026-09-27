/**
 * 認証モード。
 */
type AuthMode =
  /** E2E 専用。Supabase を使わず、メールアドレスだけで許可判定する（トークン検証なし） */
  | 'local'
  /** 本番。Google OAuth でログインし、API は Bearer トークンを Supabase で検証する */
  | 'supabase';

/**
 * local モードを許可する `NODE_ENV`。`next dev`（E2E の webServer）と Vitest だけを通す。
 *
 * 「production 以外なら許可」ではなく許可リストにしているのは、`NODE_ENV` が未設定・想定外の値の
 * ときにも supabase 側（検証あり）へ倒すため。
 */
const LOCAL_AUTH_ALLOWED_NODE_ENVS: readonly string[] = ['development', 'test'];

/**
 * 現在の認証モードを解決する。**認証モードの判定は必ずこの関数を通す**（API・画面の双方）。
 *
 * `NEXT_PUBLIC_AUTH_MODE=local` は E2E 専用のバイパスであり、local モードの
 * `/api/auth/is-allowed` はトークンを検証せずリクエストボディのメールだけで許可判定する。
 * 環境変数の設定ミスで本番に有効化されると認証が実質無効になるため、`NODE_ENV` が許可リストに
 * 無い（本番ビルド等）ときは指定を無視して supabase を返す（Issue #207）。
 *
 * どちらの値もビルド時にインライン展開されるが、判定が関数を挟むため local 分岐の UI コードは
 * バンドルに残る。安全性はバンドルからの除去ではなく、この関数が実行時に supabase を返すことで担保する。
 *
 * @returns 解決した認証モード。未設定・不明な値も supabase とする
 */
export const resolveAuthMode = (): AuthMode => {
  if (!LOCAL_AUTH_ALLOWED_NODE_ENVS.includes(process.env.NODE_ENV ?? '')) return 'supabase';
  return process.env.NEXT_PUBLIC_AUTH_MODE === 'local' ? 'local' : 'supabase';
};
