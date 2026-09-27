import { resolveAuthMode } from '@/lib/auth-mode';

/**
 * サーバー起動時に 1 度だけ呼ばれる Next.js のフック。
 *
 * `NEXT_PUBLIC_AUTH_MODE=local` が本番ビルドに設定されていた場合に警告を出す。
 * local 指定は `resolveAuthMode` が無視するため認証は迂回されないが、**設定ミス自体は
 * 起きている**（E2E 用の環境変数が本番に紛れ込んでいる）ので、黙って握りつぶさずログに残す（Issue #207）。
 */
export function register() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === 'local' && resolveAuthMode() !== 'local') {
    console.warn(
      `[auth] NEXT_PUBLIC_AUTH_MODE=local is ignored (NODE_ENV=${process.env.NODE_ENV}). Remove it from this environment.`,
    );
  }
}
