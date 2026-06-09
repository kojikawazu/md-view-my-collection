# 非機能仕様書

パフォーマンス・可用性・運用・ログ等の非機能要件を定義する。

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

## ログ仕様（最低限）

- 重要操作（ログイン/ログアウト/投稿/編集/削除）を `console.info` で記録。
- 例外は `console.error` で記録し、IDや操作種別を含める。センシティブ情報（メール・トークン等）は含めない。

> エラーハンドリング方針の正本は `.claude/rules/error-handling.md`。
