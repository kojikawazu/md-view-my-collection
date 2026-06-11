# md-view-my-collection — Report Viewer

[![Test](https://github.com/kojikawazu/md-view-my-collection/actions/workflows/test.yml/badge.svg)](https://github.com/kojikawazu/md-view-my-collection/actions/workflows/test.yml)

ChatGPT / Gemini / Perplexity などで生成した **Markdown レポートを Supabase に保存し、自分用の Web サイトで安全に閲覧・管理**するための Next.js アプリです。「流れて消える」良い記事やレポートを、あとから見返せる形にストックすることを目的にしています。

> 管理者（オーナー1人）が投稿・編集・削除を行い、閲覧は誰でも可能な「単一管理者 + 公開ビューア」型のアプリです。

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

TypeScript + Next.js 16（App Router）/ React 19 + TailwindCSS v4 を中核に、Supabase（Auth + Postgres/RLS）+ Prisma（BFF は Next.js Route Handlers）で構成。テストは Vitest + Playwright、デプロイは Vercel（`main` のみ本番）。パッケージマネージャは **pnpm**。

> 版数を含む一覧は [front/README.md](front/README.md#技術スタック)、選定理由は [docs/09-architecture-specification.md](docs/09-architecture-specification.md) を参照。

## 画面 / ルート

- ルーティング一覧（認証要件含む）: [docs/03-functional-specification.md](docs/03-functional-specification.md)
- 画面遷移: [docs/03-functional-specification.md](docs/03-functional-specification.md)

## セットアップ・開発

必要要件・セットアップ・起動（local / supabase モード）・本番セットアップ・ビルド・テストの手順は、実装ディレクトリの **[front/README.md](front/README.md)** に集約しています。

> 最短で UI を確認するなら local モード: `cd front && pnpm install && NEXT_PUBLIC_AUTH_MODE=local NEXT_PUBLIC_DATA_MODE=local pnpm dev`（詳細は [front/README.md](front/README.md)）。

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

- [docs/README.md](docs/README.md) — 仕様書の索引と読む順序
- [docs/01-business-requirements.md](docs/01-business-requirements.md) 〜 [docs/10-miscellaneous-specification.md](docs/10-miscellaneous-specification.md) — 要件・機能・非機能・データ・セキュリティ・API・テスト・アーキテクチャ・その他
- [docs/11-tasks.md](docs/11-tasks.md) — タスク一覧

## 注意

- 実装は必ず `front/` のみ。`base/` は変更禁止。
- `main` への直接コミット禁止（必ずブランチを切る）。Vercel は `main` のみ本番デプロイ（プレビュー無し）。
