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
| `NEXT_PUBLIC_AUTH_MODE` | クライアント（**E2E専用**） | `local` でローカル認証モードに切替。`playwright.config.ts` が注入 |
| `NEXT_PUBLIC_DATA_MODE` | クライアント（**E2E専用**） | `local` で localStorage データモードに切替。`playwright.config.ts` が注入 |

## 管理方針

- ローカル: `front/.env.local` に記載（`.gitignore` 対象）。
- 本番: Vercel の環境変数で管理。
- CI（テスト実行時）: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` はダミー値で動作させる。

## 注意事項

- `ADMIN_EMAIL` / `DATABASE_URL` には **`NEXT_PUBLIC_` プレフィックスを付けない**（クライアントバンドルに混入させない）。
- シークレットをコードにハードコードしない。詳細は `.claude/rules/security.md` を参照。
