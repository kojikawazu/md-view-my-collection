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
 * nonce 方式へ移行するには middleware でリクエストごとに nonce を発行する必要があり、
 * まず Report-Only で違反を観測してから判断する（#147）。
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
   * CSP は**まず Report-Only で導入**する。いきなり強制すると Supabase Auth のリダイレクトや
   * Swagger UI（`/docs`）のインラインスタイルで本番が壊れうるため、違反を観測してから
   * `Content-Security-Policy` へ切り替える。付随ヘッダーは影響が小さいため最初から強制する。
   *
   * @returns ヘッダー適用ルールの配列
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
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
