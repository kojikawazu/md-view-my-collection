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
- CI: GitHub Actions（`.github/workflows/test.yml`）で自動実行する。`static-analysis` ジョブが静的解析（整形検証 `pnpm format:check` + ESLint `pnpm lint` + 型チェック `pnpm typecheck`）、`playwright` ジョブがユニット（Vitest）→ 統合（IT・Testcontainers Postgres・`pnpm test:integration`）→ E2E（Playwright）を順に担当し、両ジョブを並列実行する。IT は ubuntu-latest 同梱の Docker で実 Postgres を起動する。
- CI（ワークフロー自体の検証）: `.github/workflows/actionlint.yml` が [actionlint](https://github.com/rhysd/actionlint) で全ワークフローを検査する。**パスフィルタをかけず全 PR で常時実行**する（実行が数秒で終わるため、変更判定ジョブを足すほうが高くつく。ワークフローが必ず起動するので required status check にしても pending で詰まらない）。バージョンは `Makefile` の `ACTIONLINT_VERSION` と揃えて固定し、ローカルでは `make actionlint` で CI と同じ検査を実行できる。`run:` の中身は shellcheck に流され、untrusted input の直挿し（スクリプトインジェクション）も検出される。
- テスト: 正常/準正常/異常をすべて必須とする（ユニット + E2E）。詳細は `docs/08-test-specification.md`。
- 監視/ログ: 不具合を早期発見できるログ設計を意識する。
- セキュリティ: Markdown表示はサニタイズ必須。Supabase RLSは「公開閲覧 + 認証ユーザーのみ書き込み」を採用する（詳細: `docs/06-security-specification.md`）。
- ログ出力: 開発/本番とも `console` のみ。本番はセキュリティ配慮（個人情報/機密を出力しない）。

## デプロイ設定（確定）

- 対象ディレクトリ: `front/` のみ（`base/` は対象外）。
- ブランチ: `main` のみ自動デプロイ。`front/vercel.json` の `git.deploymentEnabled` を **`{"**": false, "main": true}`** とする。**`deploymentEnabled` は拒否リスト**（未指定ブランチは既定で `true`）のため、`{"main": true}` だけでは Preview が止まらない。
- プレビュー: 不要（上記設定により PR ブランチではデプロイしない）。**実測で確認済み**: `"**": false` が main に載った 2026-07-26 以降、14 本の PR ブランチ push に対して Preview デプロイは 0 件（設定前は 3 本連続で発火していた / #167）。
- ビルドスキップ: **設定しない**（`ignoreCommand` を使わない）。ドキュメントのみの変更でも main へのマージではビルドが走る。**失敗が静かに起きる**（デプロイは成功扱いのまま本番だけ古くなる）性質があり、節約できるビルド 1〜2 分に見合わないため。判断根拠は `.claude/rules/vercel.md`「2. ビルドスキップ」を参照。**実測で確認済み**: ドキュメント・ルールのみの PR #174 / #181 も、main へのマージで本番デプロイされた（#167）。
- **設定ファイルの置き場所**: `vercel.json` は **Vercel の Root Directory（`front`）に置く**。リポジトリルートに置いても読み込まれない（実測で確認済み / #159）。

> **デプロイの発火制御は 2 系統ある。** GitHub Actions（`test.yml` の `paths-filter`）と Vercel の Git 連携は独立しており、**Vercel は Actions のパスフィルタを見ない**（実例: PR #150）。ただし**パスによる実行制御は、本番状態を壊さない CI 側（`paths-ignore`）に寄せる**。Vercel 側はブランチ単位の制御（`deploymentEnabled`）に留める。

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
