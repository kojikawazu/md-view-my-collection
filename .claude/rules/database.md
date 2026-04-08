---
description: Prisma ORM 命名規約・マイグレーション・クエリ規約
globs: "front/prisma/**,front/src/lib/db.ts,front/src/app/api/**"
---

# データベースルール（Prisma）

## 命名規約

- テーブル名（モデル名）: PascalCase・単数形（例: `Report`, `ReportTag`）— Prisma の規約に従う
- カラム名（フィールド名）: camelCase（例: `reportId`, `createdAt`）— Prisma の規約に従う

## マイグレーション

- **`prisma migrate` は禁止**。スキーマ変更は `prisma db pull` で既存テーブルを取得するのみ。
- DB 側のスキーマ変更は別プロジェクトで管理する。
- `schema.prisma` の変更はコードファイルのみ反映し、DB への適用は行わない。

## クエリ

- Prisma Client のパラメータバインディングを使用する。`$queryRaw` での文字列結合は禁止。
- Prisma Client はシングルトンで管理する（`front/src/lib/db.ts`）。本番でもグローバル再利用する。

## スキーマ（現行テーブル）

| テーブル | 主要フィールド |
|---|---|
| `Report` | id, title, summary, content, category, author, publishDate |
| `ReportTag` | id, name |
| `ReportTagMapping` | reportId, reportTagId |
| `ExternalUrl` | id, reportId, url, label, createdAt |

## RLS（Supabase Row Level Security）

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `Report` | 誰でも | 認証ユーザー | 認証ユーザー | 認証ユーザー |
| `ReportTag` | 誰でも | 認証ユーザー | — | — |
| `ReportTagMapping` | 誰でも | 認証ユーザー | — | 認証ユーザー |
| `ExternalUrl` | 誰でも | 認証ユーザー | 認証ユーザー | 認証ユーザー |
