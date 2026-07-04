/**
 * テスト用 DB コンテナへ適用する DDL を `prisma/schema.prisma` から生成する。
 *
 * `prisma migrate diff` は DB を変更せず SQL を出力するだけの読み取り専用 diff ツール
 * （`migrate dev/deploy/reset` とは別物）。生成物はエフェメラルな Testcontainers Postgres
 * にのみ適用され、本番 DB・`schema.prisma` は不変。`prisma migrate 禁止` ルールの
 * test-only 例外（`.claude/rules/database.md` 参照）。
 *
 * 使い方: `pnpm gen:test-schema`。`schema.prisma` を変更したら再実行して
 * `tests/integration/schema.sql`（生成物・コミット対象）を更新する。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(__dirname, '../tests/integration/schema.sql');

const raw = execFileSync(
  'npx',
  [
    'prisma',
    'migrate',
    'diff',
    '--from-empty',
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--script',
  ],
  { encoding: 'utf8' },
);

// prisma.config.ts が dotenv を読み込むため、stdout 先頭に `[dotenv...]` /
// `Loaded Prisma config` 等のバナーが混入する。最初の SQL マーカーから切り出す。
const startMatch = raw.search(/^-- (CreateSchema|CreateTable|CreateEnum)|^CREATE /m);
const ddl = startMatch >= 0 ? raw.slice(startMatch) : raw;

const header = `-- GENERATED FILE — DO NOT EDIT BY HAND.
-- Source of truth: prisma/schema.prisma. Regenerate with: pnpm gen:test-schema
-- Applied only to the ephemeral test DB container (see tests/integration/global-setup.ts).
`;

writeFileSync(OUTPUT, `${header}\n${ddl.trimStart()}`);
console.info(`[gen:test-schema] wrote ${path.relative(process.cwd(), OUTPUT)}`);
