import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import type { GlobalSetupContext } from 'vitest/node';

declare module 'vitest' {
  interface ProvidedContext {
    /** テストコンテナの Postgres 接続 URI。各ワーカーは setup-env.ts でこれを DATABASE_URL に反映する。 */
    databaseUrl: string;
  }
}

let container: StartedPostgreSqlContainer;

/**
 * IT 実行前に一度だけ、実 Postgres コンテナを起動して DDL を適用する。
 *
 * @param ctx - Vitest globalSetup コンテキスト（ワーカーへ値を渡す `provide` を含む）
 * @returns コンテナを停止する teardown 関数
 */
export default async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const uri = container.getConnectionUri();

  // 生成済み DDL（prisma/schema.prisma 由来）をエフェメラルなコンテナに適用する。
  // 失敗しても必ずコンテナを停止する（リーク防止）。
  try {
    const schema = readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
    const client = new Client({ connectionString: uri });
    await client.connect();
    await client.query(schema);
    await client.end();
  } catch (error) {
    await container.stop();
    throw error;
  }

  // globalSetup（親プロセス）と各ワーカーの両方へ接続先を伝える。
  process.env.DATABASE_URL = uri;
  provide('databaseUrl', uri);

  return async () => {
    await container?.stop();
  };
}
