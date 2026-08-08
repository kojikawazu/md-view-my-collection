import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import type { GlobalSetupContext } from 'vitest/node';
import { hasTestDatabaseUrlOverride, resolveTestDatabaseUrl } from '../support/db-target';

declare module 'vitest' {
  interface ProvidedContext {
    /** テストコンテナの Postgres 接続 URI。各ワーカーは setup-env.ts でこれを DATABASE_URL に反映する。 */
    databaseUrl: string;
  }
}

let container: StartedPostgreSqlContainer | undefined;

/**
 * IT 実行前に一度だけ、実 Postgres に接続して DDL を適用する。
 *
 * 接続先は `tests/support/db-target.ts` が解決・検証する（`DATABASE_URL` は参照しない）。
 * `TEST_DATABASE_URL` による上書きが無い場合のみ Testcontainers を起動する。
 *
 * @param ctx - Vitest globalSetup コンテキスト（ワーカーへ値を渡す `provide` を含む）
 * @returns コンテナを停止する teardown 関数
 */
export default async function setup({ provide }: GlobalSetupContext) {
  // 上書きがある場合はコンテナを起動しない（自前のローカル Postgres を使うケース）。
  // その DB は空である必要がある — 下の schema.sql は CREATE TABLE を含むため。
  if (!hasTestDatabaseUrlOverride()) {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
  }

  // 生成済み DDL（prisma/schema.prisma 由来）を適用する。
  // 失敗しても必ずコンテナを停止する（リーク防止）。
  let uri: string;
  try {
    // 接続先がローカルであることを、DDL 適用より前に検証する。
    uri = resolveTestDatabaseUrl(container?.getConnectionUri());

    const schema = readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
    const client = new Client({ connectionString: uri });
    await client.connect();
    await client.query(schema);
    await client.end();
  } catch (error) {
    await container?.stop();
    throw error;
  }

  // globalSetup（親プロセス）と各ワーカーの両方へ接続先を伝える。
  process.env.DATABASE_URL = uri;
  provide('databaseUrl', uri);

  return async () => {
    await container?.stop();
  };
}
