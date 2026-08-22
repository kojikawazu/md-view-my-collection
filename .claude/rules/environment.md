---
description: 環境変数一覧・管理方針（クライアント/サーバー区分）
globs: 
---

# 環境変数

## 一覧

| 変数 | スコープ | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | クライアント | Google OAuth リダイレクト先 |
| `ADMIN_EMAIL` | **サーバー専用** | 管理者メール（カンマ区切りで複数可）。`/api/auth/admin` で照合 |
| `DATABASE_URL` | **サーバー専用** | Supabase Postgres 接続文字列（`prisma.config.ts` で参照） |
| `UPSTASH_REDIS_REST_URL` | **サーバー専用** | レートリミットのカウンタ用 Upstash Redis の REST URL。**未設定ならレートリミットを無効化**する |
| `UPSTASH_REDIS_REST_TOKEN` | **サーバー専用** | 同上の REST トークン。URL と揃って初めて有効になる |
| `NEXT_PUBLIC_AUTH_MODE` | クライアント（**E2E専用**） | `local` でローカル認証モードに切替。`playwright.config.ts` が注入 |
| `NEXT_PUBLIC_DATA_MODE` | クライアント（**E2E専用**） | `local` で localStorage データモードに切替。`playwright.config.ts` が注入 |
| `TEST_DATABASE_URL` | **サーバー専用（テスト専用）** | IT のテスト DB 接続先。**`DATABASE_URL` は本番を指すため参照しない**。ホスト allowlist を通らない値は実行前に throw する（`testing.md` / `production-data.md`） |
| `PLAYWRIGHT_BASE_URL` | テスト実行時 | E2E の接続先。未設定なら `http://127.0.0.1:3000`（`playwright.config.ts`） |

## 管理方針

- ローカル: `front/.env.local` に記載（`.gitignore` 対象）。
- 本番: Vercel の環境変数で管理。
- CI（テスト実行時）: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` はダミー値で動作させる。
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` は **CI では設定しない**。未設定だとレートリミットが無効化されるため、E2E / IT が上限に引っかからない（`docs/06-security-specification.md`）。

## 注意事項

- `ADMIN_EMAIL` / `DATABASE_URL` / `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` には **`NEXT_PUBLIC_` プレフィックスを付けない**（クライアントバンドルに混入させない）。
- シークレットをコードにハードコードしない。詳細は `.claude/rules/security.md` を参照。
