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
npm install          # 依存インストール
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションビルド配信
npm run format       # Prettier整形
```

## Testing
- ユニットテスト: Vitest + @testing-library/react（hooks・コンポーネント・バリデーション）
- E2E: Playwright（正常/準正常/異常すべて必須）
- テスト設計: `docs/test-design/`（テストケース洗い出し → 実装の2段階）
- テスト仕様: `docs/spec/04.e2e-cases.md`
```
cd front
npm run test             # ユニットテスト実行
npm run test:watch       # ユニットテスト（watchモード）
npx playwright install   # 初回のみ
npm run test:e2e         # E2Eテスト実行
npm run test:e2e:ui      # UIモード
npm run test:e2e:report  # レポート表示
```
- ユニットテスト配置: `src/<module>/__tests__/` ディレクトリ
- E2Eは `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で動作
- CI (GitHub Actions) ではダミーの `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を使用

## Coding Conventions
- 2スペースインデント、セミコロンあり
- ReactコンポーネントはPascalCase、ユーティリティはcamelCase
- Tailwindクラスは既存の並びに合わせて読みやすさ優先
- 再利用性を意識して適切にコンポーネント分割
- `base/` のコードは参照のみ。`front/` に変更を加える

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
- Markdown表示は `rehype-sanitize` で必ずサニタイズ
- 管理者メールは `ADMIN_EMAIL` をサーバーサイドAPIで判定（クライアント環境変数には出さない）
- ローカルモード（localStorage）はE2E専用。本番はSupabaseデータのみ表示
- カテゴリは固定リスト: Development / AI / Cloud / Linux / Container / Application / Program / Hobby
- DBマイグレーション禁止。スキーマ変更はコードファイルのみ反映し、DB側は別プロジェクトで管理

## Task Management
- タスク一覧は `docs/TASKS.md` で管理
- 作業開始前に必ず `docs/TASKS.md` を確認し、現状を把握する
- タスク完了後は `docs/TASKS.md` を更新する
