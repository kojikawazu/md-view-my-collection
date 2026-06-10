# 非機能仕様書

パフォーマンス・可用性・運用・ログ等の非機能要件を定義する。

## 目次

- [非機能要件](#非機能要件)
- [デプロイ設定（確定）](#デプロイ設定確定)
- [環境変数一覧](#環境変数一覧)
- [ログ仕様（最低限）](#ログ仕様最低限)

## 非機能要件

- デプロイ: 本番運用はVercelで実施（デプロイ必須）。
- CI/CD: 自動デプロイのみ（Vercel連携を前提）。`main` ブランチのみ本番デプロイ。プレビューは不要。
- CI: GitHub ActionsでユニットテストとE2E（Playwright）を自動実行する。
- テスト: 正常/準正常/異常をすべて必須とする（ユニット + E2E）。詳細は `docs/08-test-specification.md`。
- 監視/ログ: 不具合を早期発見できるログ設計を意識する。
- セキュリティ: Markdown表示はサニタイズ必須。Supabase RLSは「公開閲覧 + 認証ユーザーのみ書き込み」を採用する（詳細: `docs/06-security-specification.md`）。
- ログ出力: 開発/本番とも `console` のみ。本番はセキュリティ配慮（個人情報/機密を出力しない）。

## デプロイ設定（確定）

- 対象ディレクトリ: `front/` のみ（`base/` は対象外）。
- ブランチ: `main` のみ自動デプロイ。
- プレビュー: 不要。
- 環境変数: Supabase接続用の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`、OAuthリダイレクト用の `NEXT_PUBLIC_SITE_URL` を設定（一覧: `.claude/rules/environment.md`）。
- ビルド: Next.js標準（`pnpm install` → `pnpm build`）。

## 環境変数一覧

`front/.env.local` に設定する。クライアント公開可否と用途を以下に示す。

| 変数 | スコープ | 必須 | 用途 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント | 本番 | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント | 本番 | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | クライアント | 本番 | Google OAuth リダイレクト先 |
| `ADMIN_EMAIL` | **サーバー専用** | 本番 | 管理者メール許可リスト（カンマ区切り可）。`/api/auth/admin` で照合 |
| `DATABASE_URL` | **サーバー専用** | 本番 | Supabase Postgres 接続文字列（Prisma が参照） |
| `NEXT_PUBLIC_AUTH_MODE` | クライアント（E2E専用） | E2E | `local` でローカル認証に切替 |
| `NEXT_PUBLIC_DATA_MODE` | クライアント（E2E専用） | E2E | `local` で localStorage データに切替 |

- `ADMIN_EMAIL` / `DATABASE_URL` はサーバー専用のため `NEXT_PUBLIC_` を付けない。
- 詳細運用（ローカル/本番/CI）は `.claude/rules/environment.md` を参照。

## ログ仕様（最低限）

- 重要操作（ログイン/ログアウト/投稿/編集/削除）を `console.info` で記録。
- 例外は `console.error` で記録し、IDや操作種別を含める。センシティブ情報（メール・トークン等）は含めない。

> エラーハンドリング方針の正本は `.claude/rules/error-handling.md`。
