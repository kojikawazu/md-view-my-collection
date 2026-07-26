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

### test-only 例外（DDL 生成）

- 統合テスト（IT）のエフェメラルな DB コンテナ用に、`prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`（`pnpm gen:test-schema`）で DDL を生成してよい。
- `migrate diff` は **DB を変更せず SQL を出力するだけの読み取り専用 diff ツール**（`migrate dev/deploy/reset` とは別物）。
- 生成物（`front/tests/integration/schema.sql`）は **Testcontainers の使い捨て DB にのみ適用**。本番 DB・Supabase・`schema.prisma` には一切適用しない。migrate 禁止ルールに抵触しない。

## 監査列

監査列（`createdAt` / `updatedAt`）は **Prisma の機構で自動設定する**。アプリケーションコードで値を組み立てない。

- **手動代入を禁止**する。`data: { updatedAt: new Date() }` のように Route Handler で監査列へ値を書かない（**`updatedAt` の手動指定は `@updatedAt` の自動更新を上書きしてしまう**）。
- 日時はスキーマ側の宣言（`createdAt DateTime @default(now())` / `updatedAt DateTime @updatedAt`）に委ねる。本プロジェクトはスキーマを DB 側で管理し `prisma db pull` で取り込むため、**宣言の追加・変更は DB 側で行う**（`prisma migrate` 禁止）。
- `createdAt` は**更新しない**。更新系の `data` に `createdAt` を含めない。
- **例外**: シードデータ・テストで日時を固定したい場合のみ明示指定を許容する。本番コードパスには持ち込まない。

> `createdBy` / `updatedBy`（操作ユーザー）・`deletedAt`（論理削除）は**現行スキーマに存在しない**。将来 DB 側に追加された場合は、呼び出し側で個別に詰めず Prisma Client Extension（`$extends` の query フック）で自動注入する。

## クエリ

- Prisma Client のパラメータバインディングを使用する。`$queryRaw` での文字列結合は禁止。
- Prisma Client はシングルトンで管理する（`front/src/lib/db.ts`）。本番でもグローバル再利用する。

## スキーマ（現行テーブル）

| テーブル | 主要フィールド |
|---|---|
| `Report` | id, title, summary, content, category, author, publishDate, createdAt, updatedAt |
| `ReportTag` | id, name, createdAt |
| `ReportTagMapping` | id, reportId, reportTagId, createdAt |
| `ExternalUrl` | id, reportId, url, label, createdAt |

## RLS（Supabase Row Level Security）

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `Report` | 誰でも | 認証ユーザー | 認証ユーザー | 認証ユーザー |
| `ReportTag` | 誰でも | 認証ユーザー | — | — |
| `ReportTagMapping` | 誰でも | 認証ユーザー | — | 認証ユーザー |
| `ExternalUrl` | 誰でも | 認証ユーザー | 認証ユーザー | 認証ユーザー |
