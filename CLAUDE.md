# CLAUDE.md

## Project Overview

Markdownレポートの保存・閲覧UIを提供するNext.jsアプリ。
要件・UI・E2E仕様は `docs/` に集約。

## Project Structure

- `base/` — 参照用の原本（**読み取り専用・変更禁止**）
- `front/` — 実装ディレクトリ（Next.js App Router）。すべての開発はここで行う
- `docs/` — 要件定義・UI仕様・E2Eテスト仕様・タスク管理

### front/ の構成

- `front/src/app/` — App Routerのルート（`/`, `/login`, `/report/*`）
- `front/src/components/` — 共通UIコンポーネント
- `front/src/constants/` — 定数（ドメイン単位。`theme.ts` / `report.ts` / `auth.ts`）
- `front/src/types/` — 型定義（ドメイン単位。`theme.ts` / `report.ts` / `user.ts` / `api.ts`）
- `front/src/schemas/` — Zod スキーマ（API 契約の単一ソース）
- `front/src/repositories/` — BFF（`/api/*`）へのアクセス。**`fetch` を書いてよいのはここだけ**
- `front/src/lib/` — 通信を持たない純粋ユーティリティ

## Tech Stack

- TypeScript + Next.js 16 (App Router) + React 19 + TailwindCSS v4
- Markdown: react-markdown + remark-gfm + rehype-sanitize
- 認証: Supabase Auth (Google OAuth)
- DB: Supabase Postgres (RLS)
- ORM: Prisma (`prisma db pull` のみ。マイグレーション禁止)
- バリデーション/API契約: zod + zod-openapi（`src/schemas/` を単一ソースに `docs/openapi.json` を生成）
- IT（統合）: Vitest + Testcontainers（Postgres）— APIルート×実DB。Docker 必須。`pnpm test:integration`
- E2E: Playwright
- Deploy: Vercel (`main` ブランチのみ本番デプロイ、プレビュー無し)

## Key Design Decisions

- ローカルモード（localStorage）はE2E専用。本番はSupabaseデータのみ表示
- カテゴリは固定リスト: Development / AI / Cloud / Linux / Container / Application / Program / Hobby

## Task Management

- タスク一覧は `docs/11-tasks.md` で管理
- 作業開始前に必ず `docs/11-tasks.md` を確認し、現状を把握する
- タスク完了後は `docs/11-tasks.md` を更新する

## Rules

詳細ルールは `.claude/rules/` を参照:

| ファイル | スコープ | 内容 |
|---|---|---|
| `coding-standards.md` | 全体 | コーディング規約（TypeScript/pnpm/ESLint/Prettier） |
| `documentation.md` | 全体 | ドキュメント更新・設計書管理ルール（影響マップ + opt-out の完了条件） |
| `commands.md` | 全体 | Build & Dev コマンド（pnpm dev / build / typecheck / format / gen:* 等） |
| `environment.md` | 全体 | 環境変数一覧・管理方針 |
| `error-handling.md` | 全体 | エラーハンドリング方針（バリデーション・ログ・HTTPステータス） |
| `git-workflow.md` | 全体 | ブランチ運用・コミットメッセージ・マージ条件（PR 本文の中身は `pr-description.md`） |
| `pr-description.md` | 全体 | PR 初回コメントの必須セクション（変更種別ごとに固定。`.github/PULL_REQUEST_TEMPLATE/` は本ルールを写した骨格） |
| `lessons-learned.md` | 全体 | 誤り・失敗・ハマりから得た教訓を `docs/lessons-learned.md` に追記・蓄積する運用 |
| `github-issue.md` | 全体 | GitHub issue 駆動開発（ブランチと対で起票・open/close で進捗管理・PR で自動クローズ） |
| `security.md` | 全体 | セキュリティ設計方針（認証・RLS・XSS対策・シークレット管理） |
| `production-data.md` | 全体 | 本番データの保護（本番 Supabase への破壊的操作の禁止・AI エージェントへの制約・例外手順） |
| `codex.md` | 全体 | Codex 利用時のエージェント運用（AGENTS.md の階層適用・Claude 固有機能の読み替え・PR 承認/マージをしない） |
| `testing.md` | 全体 | テスト方針・コマンド・配置規約（UT: Vitest / IT: Vitest + Testcontainers / E2E: Playwright） |
| `duplication.md` | 全体 | 重複と共通化の判断基準（同じ知識のみ共通化・3回目で共通化・`common`/`util` を置き場にしない） |
| `dead-code.md` | 全体 | デッドコード禁止（コメントアウト・未使用 export・旧実装・スキップ放置テストを残さない） |
| `static-analysis.md` | 全体 | 静的解析の運用（Formatter と Linter の役割分担・CI 必須・警告ゼロ・抑制コメントは理由と最小範囲） |
| `github-actions.md` | `.github/workflows/**` | GitHub Actions のルール（ワークフローの静的解析 actionlint・関係あるジョブのみ実行・必須チェックと `paths-ignore` の併用禁止・デプロイは main のみ） |
| `vercel.md` | `front/vercel.json` | Vercel のデプロイ制御（Root Directory 直下に配置・`git.deploymentEnabled` は拒否リストで `main` のみ許可・`ignoreCommand` は使わない） |
| `frontend.md` | `front/src/components/**`, `front/src/app/**`, `front/src/hooks/**`, `front/src/repositories/**`, `front/src/schemas/**` | Next.js App Router フロントエンド設計・アトミックデザイン規約・関心別ディレクトリ（`repositories/` に fetch を集約） |
| `api.md` | `front/src/app/api/**` | Next.js BFF（Route Handlers）設計・API ルール |
| `database.md` | `front/prisma/**`, `front/src/lib/db.ts`, `front/src/app/api/**` | Prisma ORM 規約・マイグレーション禁止・監査列の自動設定・RLSポリシー |
| `typescript.md` | `front/src/**` | TypeScript 固有規約（type/interface の使い分け・型/定数の配置・any 禁止・enum 回避・`import type`） |
| `jsdoc.md` | `front/src/**` | JSDoc（TSDoc）ドキュメンテーションコメント規約（公開シンボル必須・型は書かない・why 重視） |
