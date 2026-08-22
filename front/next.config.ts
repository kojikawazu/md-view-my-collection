import type { NextConfig } from 'next';

// Supabase への接続先。`connect-src` で明示的に許可する必要がある
// （未設定のビルド（CI のダミー値なし等）でも CSP が壊れないよう空文字を許容する）。
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Content-Security-Policy のディレクティブ定義。
 *
 * Markdown 由来の HTML は `rehype-sanitize` でサニタイズしているが、単一障害点にしないための
 * 多層防御として CSP を重ねる（`.claude/rules/security.md`）。
 *
 * `script-src` / `style-src` に `'unsafe-inline'` を許しているのは、Next.js の
 * ハイドレーション用インラインスクリプトと Tailwind / Swagger UI のインラインスタイルのため。
 * nonce 方式へ移行するには middleware でリクエストごとに nonce を発行する必要があるため、
 * 強制への切り替え（#166）とは分けて判断する。見送りの理由は
 * `docs/06-security-specification.md`「nonce 化を見送る判断」に記録している。
 */
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Markdown 本文が外部画像を参照しうるため https: を広めに許可する。
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabaseOrigin}`.trim(),
].join('; ');

const nextConfig: NextConfig = {
  /**
   * 全レスポンスに付与するセキュリティヘッダー。
   *
   * CSP は #147 で Report-Only（観測モード）として導入し、#166 で**強制へ切り替えた**。
   * 切り替えの前提として、本番の公開導線とローカル本番ビルドの認証後導線（ログイン / 一覧 /
   * 詳細 / Markdown 描画 / 作成・編集 / `/docs`）で違反が 0 件であることを観測している。
   * 観測結果は `docs/06-security-specification.md`「CSP 強制化の観測記録」を参照。
   *
   * @returns ヘッダー適用ルールの配列
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    '127.0.0.1',
    '127.0.0.1:3000',
    'localhost',
    'localhost:3000',
    '0.0.0.0:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://localhost:3000',
    'http://0.0.0.0:3000',
  ],
};

export default nextConfig;
