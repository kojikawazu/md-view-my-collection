# md-view-my-collection — Report Viewer

[![Test](https://github.com/kojikawazu/md-view-my-collection/actions/workflows/test.yml/badge.svg)](https://github.com/kojikawazu/md-view-my-collection/actions/workflows/test.yml)

ChatGPT / Gemini / Perplexity などで生成した **Markdown レポートを Supabase に保存し、自分用の Web サイトで安全に閲覧・管理**するための Next.js アプリです。「流れて消える」良い記事やレポートを、あとから見返せる形にストックすることを目的にしています。

> 管理者（オーナー1人）が投稿・編集・削除を行い、閲覧は誰でも可能な「単一管理者 + 公開ビューア」型のアプリです。

<!-- スクリーンショット: 一覧 / 詳細 / 投稿フォーム の画像をここに追加してください -->
<!-- ![一覧画面](docs/assets/list.png) -->

## 主な機能

- **レポート一覧**: カードUI（カテゴリバッジ・日付・タイトル・要約・著者）、新しい順表示
- **フィルタ**: サイドバーのカテゴリ / タグで絞り込み（再クリックで解除、一覧復帰でリセット）
- **ページング**: 1ページ10件、ページ番号は最大5個、`前へ`/`次へ`
- **詳細表示**: Markdown を `rehype-sanitize` で安全にレンダリング（GFM テーブル・タスクリスト等対応）
- **外部リンク**: レポートに外部URL（note / Zenn / はてなブログ等）を複数紐付けて表示
- **管理者操作**: 新規作成 / 編集 / 削除（削除・投稿・更新は確認モーダル必須）
- **Markdown Style Lab**: 表示デザイン検証用ページ（`/report/markdown-lab`、認証必須）
- **認証**: Supabase Auth（Google OAuth）。管理者は `ADMIN_EMAIL` 許可リストで判定
- **2つの動作モード**: 本番＝Supabaseデータ / E2E＝localStorage（後述）

カテゴリは固定8種: Development / AI / Cloud / Linux / Container / Application / Program / Hobby

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| 言語 | TypeScript 5（strict） |
| フレームワーク | Next.js 16（App Router） / React 19 |
| スタイリング | TailwindCSS v4 |
| Markdown | react-markdown 10 + remark-gfm 4 + rehype-sanitize 6 |
| 認証 | Supabase Auth（Google OAuth） |
| DB | Supabase Postgres（RLS） |
| ORM | Prisma 6（`db pull` のみ・マイグレーション禁止） |
| BFF | Next.js Route Handlers（`/api/*`） |
| テスト | Vitest（ユニット） + Playwright（E2E） |
| デプロイ | Vercel（`main` のみ本番、プレビュー無し） |
| パッケージマネージャ | **pnpm**（npm / yarn は使用しない） |

## 画面 / ルート

| パス | 画面 | 認証 |
|---|---|---|
| `/` | レポート一覧 | 公開 |
| `/report/:id` | レポート詳細 | 公開 |
| `/report/new` | 新規作成 | 管理者 |
| `/report/:id/edit` | 編集 | 管理者 |
| `/report/markdown-lab` | Markdown Style Lab | 管理者 |
| `/login` | ログイン | — |

## 必要要件

- Node.js 20+ / pnpm 9+（`npm i -g pnpm` で導入）
- （本番データを扱う場合）Supabase プロジェクト + Google OAuth クライアント

## クイックスタート（まずは local モードで動かす）

Supabase を用意しなくても、E2E 用の **local モード**（localStorage のダミーデータ）で UI を確認できます。最短で動かすならこちら。

```bash
cd front
pnpm install
NEXT_PUBLIC_AUTH_MODE=local NEXT_PUBLIC_DATA_MODE=local pnpm dev
# http://localhost:3000
```

> 通常の `pnpm dev` は **supabase モード**で起動し、`.env.local`（後述）が無いとデータを取得できません。初見はまず local モードを推奨します。

## 環境変数

`front/.env.local` に設定します（テンプレートは `front/.env.local.example`）。

| 変数 | スコープ | 必須 | 用途 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント | 本番 | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント | 本番 | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | クライアント | 本番 | Google OAuth リダイレクト先 |
| `ADMIN_EMAIL` | **サーバー専用** | 本番 | 管理者メール許可リスト（カンマ区切り可）。`/api/auth/admin` で照合 |
| `DATABASE_URL` | **サーバー専用** | 本番 | Supabase Postgres 接続文字列（Prisma が参照） |
| `NEXT_PUBLIC_AUTH_MODE` | クライアント | E2E | `local` でローカル認証に切替 |
| `NEXT_PUBLIC_DATA_MODE` | クライアント | E2E | `local` で localStorage データに切替 |

> `ADMIN_EMAIL`（管理者ログイン）と `DATABASE_URL`（API/DB書き込み）が無いと、本番モードで投稿・編集・削除が動きません。詳細は `.claude/rules/environment.md` を参照。

## 本番セットアップ（supabase モード）

1. **Supabase プロジェクト作成** — `Report` / `ReportTag` / `ReportTagMapping` / `ExternalUrl` テーブルと RLS を用意（スキーマは `docs/05-data-specification.md`）。DBスキーマ変更は別プロジェクトで管理し、本リポジトリは `pnpm prisma db pull` で取り込むのみ。
2. **Google OAuth** — Supabase Auth に Google プロバイダを設定し、リダイレクトに `NEXT_PUBLIC_SITE_URL` を使用。
3. **環境変数** — 上表のキーを `front/.env.local` に設定（`front/.env.local.example` をコピー）。
4. **起動** — `cd front && pnpm install && pnpm dev`。

## ビルド

```bash
cd front
pnpm build
pnpm start
```

## テスト

```bash
cd front
pnpm test                  # ユニット（Vitest）
pnpm exec playwright install   # 初回のみ
pnpm test:e2e              # E2E（Playwright）
```

E2E は `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` 前提で動作します（`front/playwright.config.ts` が注入）。

## ディレクトリ構成

```
.
├── front/   実装（Next.js App Router）— 開発はここで行う
├── docs/    番号付き仕様書（01〜11、フラット構成）
├── base/    旧 Vite + React 実装の凍結スナップショット（参照専用・変更禁止）
├── CLAUDE.md / AGENTS.md   AIエージェント向け指示
└── .claude/rules/          コーディング/設計ルール
```

## ドキュメント

- `docs/README.md` — 仕様書の索引と読む順序
- `docs/01-business-requirements.md` 〜 `docs/10-miscellaneous-specification.md` — 要件・機能・非機能・データ・セキュリティ・API・テスト・アーキテクチャ・その他
- `docs/11-tasks.md` — タスク一覧

## 注意

- 実装は必ず `front/` のみ。`base/` は変更禁止。
- `main` への直接コミット禁止（必ずブランチを切る）。Vercel は `main` のみ本番デプロイ（プレビュー無し）。
