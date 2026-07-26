---
description: Build & Dev コマンド（pnpm / Prisma）
globs: 
---

# Build & Dev コマンド

すべて `front/` ディレクトリで実行する。

## 開発・ビルド

```bash
pnpm install   # 依存インストール（postinstall で prisma generate が自動実行される）
pnpm dev       # 開発サーバー起動（http://localhost:3000）
pnpm build     # プロダクションビルド
pnpm start     # プロダクションビルド配信
pnpm lint      # ESLint 実行（CI のグリーン条件 / git-workflow.md 参照）
pnpm typecheck # tsc --noEmit（CI 必須。ビルドは型を検査しないため別途実行する / typescript.md 参照）
pnpm format    # Prettier 整形
```

## コード生成

```bash
pnpm gen:openapi      # lib/schemas/（zod）から docs/openapi.json を生成（api.md 参照）
pnpm gen:test-schema  # IT 用の schema.sql を生成（database.md の test-only 例外）
```

- スキーマ・検証ルールを変更したら `pnpm gen:openapi` を実行し、生成物をコミットする。

## テスト

テストコマンドは `.claude/rules/testing.md` を参照。

## Prisma

```bash
pnpm prisma db pull       # 既存DBスキーマを取得（マイグレーションは禁止）
pnpm prisma generate      # Prisma Client 再生成
```

- `prisma migrate` は禁止。詳細は `.claude/rules/database.md` を参照。
