---
description: Build & Dev コマンド（pnpm / Prisma）
globs: 
---

# Build & Dev コマンド

すべて `front/` ディレクトリで実行する。

## 開発・ビルド

```bash
pnpm install   # 依存インストール
pnpm dev       # 開発サーバー起動（http://localhost:3000）
pnpm build     # プロダクションビルド
pnpm start     # プロダクションビルド配信
pnpm format    # Prettier 整形
```

## テスト

テストコマンドは `.claude/rules/testing.md` を参照。

## Prisma

```bash
pnpm prisma db pull       # 既存DBスキーマを取得（マイグレーションは禁止）
pnpm prisma generate      # Prisma Client 再生成
```

- `prisma migrate` は禁止。詳細は `.claude/rules/database.md` を参照。
