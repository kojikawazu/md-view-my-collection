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
- `front/src/constants.tsx` — テーマ・初期データ
- `front/src/types.ts` — 型定義
- `front/src/lib/` — ユーティリティ

## Tech Stack
- TypeScript + Next.js 16 (App Router) + React 19 + TailwindCSS v4
- Markdown: react-markdown + remark-gfm + rehype-sanitize
- 認証: Supabase Auth (Google OAuth)
- DB: Supabase Postgres (RLS)
- ORM: Prisma (`prisma db pull` のみ。マイグレーション禁止)
- E2E: Playwright
- Deploy: Vercel (`main` ブランチのみ本番デプロイ、プレビュー無し)

## Build & Dev Commands
すべて `front/` ディレクトリで実行:
```
pnpm install         # 依存インストール
pnpm dev             # 開発サーバー起動
pnpm build           # プロダクションビルド
pnpm start           # プロダクションビルド配信
pnpm format          # Prettier整形
```

## Testing
```
cd front
pnpm test                    # ユニットテスト実行
pnpm test:watch              # ウォッチモード
pnpm exec playwright install # 初回のみ
pnpm test:e2e                # E2Eテスト実行
pnpm test:e2e:ui             # UIモード
pnpm test:e2e:report         # レポート表示
```
- テスト設計: `docs/test-design/` / テスト仕様: `docs/spec/04.e2e-cases.md`
- CI では `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` にダミー値を使用
- 詳細方針は `.claude/rules/testing.md` を参照

## Commit & Branch Rules
- 開発は必ずブランチを切って作業する（`main` 直接作業禁止）
- コミットメッセージは短い命令形（例: "Add report filter state"）
- PRには概要・テストメモ・UI変更時はスクリーンショットを含める

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_SITE_URL` — Google OAuthリダイレクト用
- `ADMIN_EMAIL` — 管理者メール（サーバーサイドAPI経由で制御、カンマ区切りで複数指定可）
- `DATABASE_URL` — Supabase Postgres接続（`prisma.config.ts` で参照）

## Key Design Decisions
- ローカルモード（localStorage）はE2E専用。本番はSupabaseデータのみ表示
- カテゴリは固定リスト: Development / AI / Cloud / Linux / Container / Application / Program / Hobby
- セキュリティ・DB詳細は `.claude/rules/security.md` / `.claude/rules/database.md` を参照

## Task Management
- タスク一覧は `docs/TASKS.md` で管理
- 作業開始前に必ず `docs/TASKS.md` を確認し、現状を把握する
- タスク完了後は `docs/TASKS.md` を更新する

## Rules

詳細ルールは `.claude/rules/` を参照:

| ファイル | スコープ | 内容 |
|---|---|---|
| `coding-standards.md` | 全体 | コーディング規約（TypeScript/pnpm/ESLint/Prettier） |
| `error-handling.md` | 全体 | エラーハンドリング方針（バリデーション・ログ・HTTPステータス） |
| `security.md` | 全体 | セキュリティ設計方針（認証・RLS・XSS対策・シークレット管理） |
| `testing.md` | 全体 | テスト方針・配置規約（Vitest + Playwright） |
| `frontend.md` | `front/src/components/**`, `front/src/app/**`, `front/src/hooks/**` | Next.js App Router フロントエンド設計・アトミックデザイン規約 |
| `api.md` | `front/src/app/api/**` | Next.js BFF（Route Handlers）設計・API ルール |
| `database.md` | `front/prisma/**`, `front/src/lib/db.ts`, `front/src/app/api/**` | Prisma ORM 規約・マイグレーション禁止・RLSポリシー |
