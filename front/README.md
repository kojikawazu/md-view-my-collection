# front — Report Viewer (Next.js App Router)

Markdown レポートの保存・閲覧 UI の**実装ディレクトリ**です。すべての開発はここで行います（`base/` は参照専用・変更禁止）。

> プロジェクト全体像・主な機能・本番セットアップは リポジトリ直下の [../README.md](../README.md) を参照。本書は `front/` 内で開発する人向けの作業手引きです。

## 目次

- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [必要要件](#必要要件)
- [環境構築](#環境構築)
- [クイックスタート](#クイックスタート)
- [動作モード（local / supabase）](#動作モードlocal--supabase)
- [本番セットアップ（supabase モード）](#本番セットアップsupabase-モード)
- [静的解析・フォーマット](#静的解析フォーマット)
- [テスト](#テスト)
- [API 仕様（OpenAPI）](#api-仕様openapi)
- [Prisma / DB スキーマ](#prisma--db-スキーマ)
- [注意点](#注意点)
- [ドキュメント](#ドキュメント)

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| 言語 | TypeScript 5（strict） |
| フレームワーク | Next.js 16（App Router） / React 19 |
| スタイリング | TailwindCSS v4 |
| Markdown | react-markdown 10 + remark-gfm 4 + rehype-sanitize 6 |
| 認証 | Supabase Auth（Google OAuth） |
| DB / ORM | Supabase Postgres（RLS） / Prisma 6（`db pull` のみ・マイグレーション禁止） |
| BFF | Next.js Route Handlers（`src/app/api/*`） |
| バリデーション / API契約 | zod 4 + zod-openapi 5（スキーマから OpenAPI 生成） |
| テスト | Vitest（ユニット / 統合） + Testcontainers（IT用 Postgres） + Playwright（E2E） |
| 静的解析 | ESLint 9 + Prettier 3 |
| パッケージマネージャ | **pnpm**（npm / yarn は使用しない） |

詳細な技術選定理由は [../docs/09-architecture-specification.md](../docs/09-architecture-specification.md) を参照。

## ディレクトリ構成

```
front/
├── src/
│   ├── app/                     App Router のルート
│   │   ├── page.tsx             /            一覧
│   │   ├── login/               /login       ログイン
│   │   ├── report/[id]/         /report/:id  詳細・編集（page.tsx + client.tsx）
│   │   ├── report/new/          /report/new  新規作成
│   │   ├── report/markdown-lab/ 表示デザイン検証ページ（認証必須）
│   │   └── api/                 BFF（Route Handlers）
│   │       ├── auth/{admin,is-allowed}/   管理者・許可メール判定
│   │       ├── reports/[id]/               一覧/詳細/作成/更新/削除
│   │       └── tags/                       タグ一覧
│   ├── components/              アトミックデザイン（atoms / molecules / organisms / pages）
│   ├── hooks/                   クライアントロジック（カスタムフック）
│   ├── lib/                     db / auth-server / supabaseClient / validation
│   ├── providers/              アプリ全体の Context Provider
│   ├── constants.tsx           テーマ・初期データ
│   └── types.ts                型定義
├── prisma/                     schema.prisma（db pull で取得）
├── tests/e2e/                  Playwright E2E（app.spec.ts / helpers.ts）
├── tests/integration/          Vitest 統合テスト（*.test.ts / schema.sql / global-setup.ts）
├── public/                     静的アセット
└── 設定: next.config.ts / playwright.config.ts / vitest.config.ts /
         vitest.integration.config.ts / eslint.config.mjs / prisma.config.ts / tsconfig.json
```

設計方針（サーバー/クライアント分離・アトミックデザイン）は [../.claude/rules/frontend.md](../.claude/rules/frontend.md) を参照。

## 必要要件

- Node.js 20+ / pnpm 9+（`npm i -g pnpm` で導入）
- （本番データを扱う場合のみ）Supabase プロジェクト + Google OAuth クライアント

## 環境構築

```bash
cd front
pnpm install   # postinstall で prisma generate が自動実行される
```

環境変数は `front/.env.local` に設定します（`.gitignore` 対象）。テンプレートの `front/.env.local.example` をコピーして埋めてください。変数一覧は [../.claude/rules/environment.md](../.claude/rules/environment.md) を参照。

```bash
cp .env.local.example .env.local
```


- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase クライアント
- `NEXT_PUBLIC_SITE_URL` — Google OAuth リダイレクト先
- `ADMIN_EMAIL`（**サーバー専用**） — 管理者メール許可リスト（カンマ区切り）
- `DATABASE_URL`（**サーバー専用**） — Prisma / Supabase Postgres 接続文字列
- `NEXT_PUBLIC_AUTH_MODE` / `NEXT_PUBLIC_DATA_MODE`（**E2E専用**） — `local` でローカルモードに切替

> `ADMIN_EMAIL` / `DATABASE_URL` に `NEXT_PUBLIC_` を付けないこと（クライアントバンドルに混入する）。

## クイックスタート

Supabase を用意しなくても、**local モード**（localStorage のダミーデータ）で UI を確認できます。最短はこちら。

```bash
cd front
pnpm install
NEXT_PUBLIC_AUTH_MODE=local NEXT_PUBLIC_DATA_MODE=local pnpm dev
# http://localhost:3000
```

通常起動（**supabase モード** / `.env.local` が必要）:

```bash
pnpm dev      # 開発サーバー
pnpm build    # 本番ビルド
pnpm start    # ビルド成果物を配信
```

## 動作モード（local / supabase）

このアプリは認証・データ取得をそれぞれ2モードで切り替えます。環境変数 `NEXT_PUBLIC_AUTH_MODE` / `NEXT_PUBLIC_DATA_MODE` で制御し、**未設定なら supabase モード**になります。

| | local モード（`=local`） | supabase モード（既定） |
|---|---|---|
| 認証（`NEXT_PUBLIC_AUTH_MODE`） | ダミー認証。`ADMIN_EMAIL` 不要 | Supabase Auth（Google OAuth）+ `ADMIN_EMAIL` 照合 |
| データ（`NEXT_PUBLIC_DATA_MODE`） | localStorage のダミーデータ | Supabase Postgres（Prisma 経由） |
| 用途 | E2E / UI 確認（`.env.local` 不要） | 開発・本番 |

- 本番は **supabase モードのみ**。local モードは E2E 専用で、本番データは表示しません。
- E2E 実行時は `playwright.config.ts` が両変数に `local` を注入します（手動設定は不要）。

## 本番セットアップ（supabase モード）

本番データを扱う場合の初期セットアップ。DB スキーマ変更は本リポジトリで行わず、別プロジェクトで管理する。

1. **Supabase プロジェクト作成** — `Report` / `ReportTag` / `ReportTagMapping` / `ExternalUrl` テーブルと RLS を用意（スキーマは [../docs/05-data-specification.md](../docs/05-data-specification.md)）。本リポジトリは `pnpm prisma db pull` で取り込むのみ。
2. **Google OAuth** — Supabase Auth に Google プロバイダを設定し、リダイレクトに `NEXT_PUBLIC_SITE_URL` を使用。
3. **環境変数** — `front/.env.local` に各キーを設定（`.env.local.example` をコピー）。
4. **起動** — `pnpm install && pnpm dev`。

## 静的解析・フォーマット

```bash
pnpm lint     # ESLint（CI のグリーン条件）
pnpm format   # Prettier 整形（--write）
```

- TypeScript strict / 2スペース / セミコロンあり。規約は [../.claude/rules/coding-standards.md](../.claude/rules/coding-standards.md)。
- インポートは `@/*` パスエイリアスを使用する。

## テスト

正常 / 準正常 / 異常をユニット・統合・E2E で必須にしています（[../.claude/rules/testing.md](../.claude/rules/testing.md)）。

```bash
pnpm test              # ユニット（Vitest） — src/<module>/__tests__/ に配置
pnpm test:watch        # ユニット（watch）
pnpm test:integration  # 統合（Vitest + Testcontainers Postgres） — tests/integration/ ※Docker 必須
pnpm exec playwright install   # E2E 初回のみ
pnpm test:e2e          # E2E（Playwright） — tests/e2e/ に配置
pnpm test:e2e:ui       # E2E（UIモード）
pnpm test:e2e:report   # 直近の E2E レポート表示
```

- **統合テスト（IT）**は APIルート × 実 DB を検証します。**Docker が必要**（Testcontainers が使い捨て Postgres を起動）。認証はモック、DB スキーマは `pnpm gen:test-schema`（`schema.prisma` から DDL 生成）で更新します。テストデータはコンテナ破棄 + `TRUNCATE` で残しません。
- **E2E** は `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` 前提で動作します（`playwright.config.ts` が注入）。

テストケース設計は [../docs/08-test-specification.md](../docs/08-test-specification.md)。

## API 仕様（OpenAPI）

API の契約（リクエスト/レスポンス・ステータス）の正準は、zod スキーマ（`src/lib/schemas/report.ts`）から生成する **`docs/openapi.json`**（OpenAPI 3.1）です。

```bash
pnpm gen:openapi   # zod スキーマ → docs/openapi.json を再生成
```

- ブラウザで閲覧する場合は `/docs`（Swagger UI・**管理者のみ**）。スペックは管理者ゲート付き `/api/openapi` から取得する。
- バリデーションと API ドキュメントは同じ zod スキーマを単一ソースとする。ランタイム検証は `src/lib/validation.ts`（zod アダプタ、`{ data, errors }` 契約を維持）。
- スキーマ（schema / 検証ルール）を変更したら `pnpm gen:openapi` を実行し、生成物をコミットする。
- 設計判断・エンドポイント概要は [../docs/07-api-specification.md](../docs/07-api-specification.md) を参照。

## Prisma / DB スキーマ

```bash
pnpm prisma db pull   # 既存 DB スキーマを schema.prisma に取り込む
pnpm prisma generate  # Prisma Client を再生成（pnpm install の postinstall でも自動実行）
```

- **`prisma migrate` は禁止**。スキーマ変更は DB 側（別プロジェクト）で行い、本リポジトリは `db pull` で取り込むのみ。
- 接続文字列は `DATABASE_URL`（サーバー専用）。スキーマ・RLS は [../docs/05-data-specification.md](../docs/05-data-specification.md)、ORM 規約は [../.claude/rules/database.md](../.claude/rules/database.md) を参照。

## 注意点

- 実装は `front/` のみ。`base/`（旧 Vite 実装の凍結スナップショット）は変更禁止。
- **Prisma マイグレーション禁止**。スキーマ変更は `pnpm prisma db pull` で取り込むのみ（DB 側は別プロジェクトで管理）。[../.claude/rules/database.md](../.claude/rules/database.md)
- local モードは E2E 専用。本番は Supabase データのみ表示する。
- Markdown 表示は `rehype-sanitize` で必ずサニタイズ（生 HTML 挿入禁止）。[../.claude/rules/security.md](../.claude/rules/security.md)
- `main` への直接コミット禁止（必ずブランチを切る）。Vercel は `main` のみ本番デプロイ（プレビュー無し）。[../.claude/rules/git-workflow.md](../.claude/rules/git-workflow.md)
- コード変更時は影響するドキュメントを同一 PR で更新する。[../.claude/rules/documentation.md](../.claude/rules/documentation.md)

## ドキュメント

- [../docs/README.md](../docs/README.md) — 仕様書の索引と読む順序
- [../docs/03-functional-specification.md](../docs/03-functional-specification.md) — 画面・ルーティング・外部URL
- [../docs/07-api-specification.md](../docs/07-api-specification.md) — Route Handlers / API
- [../docs/09-architecture-specification.md](../docs/09-architecture-specification.md) — アーキテクチャ・技術スタック
- [../docs/11-tasks.md](../docs/11-tasks.md) — タスク一覧（作業前後で確認・更新）
- 実装/設計ルール: [../.claude/rules/](../.claude/rules/)
