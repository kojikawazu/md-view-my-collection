---
description: セキュリティ設計方針（認証・通信・インジェクション対策・シークレット管理）
globs: 
---

# セキュリティ

## 認証・認可

- 認証方式: Supabase Auth（Google OAuth）。
- 管理者判定は `ADMIN_EMAIL` 環境変数をサーバーサイドAPI（`/api/auth/admin`）で判定する。クライアント環境変数（`NEXT_PUBLIC_*`）に出さない。
- API エンドポイントごとにアクセス制御を設定する（公開 / 認証必須）。
- RLS（Row Level Security）: Supabase 全テーブルで有効。SELECT は公開、INSERT/UPDATE/DELETE は認証ユーザーのみ。

## 通信・アクセス制御

- 全通信は **HTTPS** を必須とする（Vercel デプロイで自動適用）。
- **CORS** は許可するオリジンを明示的に指定する（`*` は本番で使用しない）。
- **レートリミット**を導入する。特に**認証系エンドポイント**（`/api/auth/admin` / `/api/auth/is-allowed`）は、総当たりや列挙を許さないよう厳しく制限する。
  - 実装は `front/src/lib/rate-limit.ts`（Upstash Redis / `@upstash/ratelimit`）。各 Route Handler の**先頭**で判定し、超過時は認可より前に 429 で打ち切る（Issue #146）。**環境変数 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` が未設定の環境では無効（素通し）になる** — E2E / CI を壊さないための設計であり、本番で効かせるには設定が要る。対象・制限値・脅威・実装の判断は `docs/06-security-specification.md`「レートリミット」を参照。
- **CSP（Content-Security-Policy）ヘッダー**を設定する。Markdown 由来の HTML を描画するため、`rehype-sanitize` によるサニタイズと**多層防御**にする（片方だけに依存しない）。
  - 実装は `front/next.config.ts` の `headers()`。**`Content-Security-Policy` として強制済み**（#147 で Report-Only 導入 → #166 で観測のうえ強制へ切替）。付随ヘッダー（`X-Frame-Options` / `Referrer-Policy` / `X-Content-Type-Options` / `Permissions-Policy`）も強制。ディレクティブの一覧・観測記録・`script-src` を nonce 化していない理由は `docs/06-security-specification.md` を参照。

## インジェクション対策

- **SQL インジェクション**: Prisma Client のパラメータバインディングを必須とする。`$queryRaw` での文字列結合は禁止。
- **XSS**: Markdown 表示は `rehype-sanitize` で必ずサニタイズする（デフォルトスキーマ使用）。ユーザー入力の生HTML挿入は行わない。
- **CSRF**: Bearer Token 認証（Cookie に保存しない）のため CSRF トークンは不要。

## シークレット管理

- ローカル環境: `.env.local`（`.gitignore` に追加必須）
- 本番環境: Vercel 環境変数で管理
- `ADMIN_EMAIL` / `DATABASE_URL` はサーバーサイド専用（`NEXT_PUBLIC_` プレフィックスを付けない）
- サーバー専用モジュールは先頭で `import 'server-only'` し、Client Component からの import をビルド時に失敗させる（`frontend.md` のレイヤ依存ルールと対になる機械的ガード）
