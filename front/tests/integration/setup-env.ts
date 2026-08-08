import { inject } from 'vitest';
import { assertLocalDatabaseTarget } from '../support/db-target';

// 各ワーカーで、テスト本体（および Prisma シングルトン `@/lib/db` の import）より前に
// DATABASE_URL をテストコンテナの接続先へ確定させる。
// globalSetup で検証済みだが、ワーカーは別プロセスで起動するため、Prisma が読む直前の
// 値をここでも検証する（検証済みの値が渡ってくる前提に寄りかからない）。
process.env.DATABASE_URL = assertLocalDatabaseTarget(inject('databaseUrl'), 'testcontainers');

// requireAdmin / auth ルートが参照する env。Supabase 呼び出し自体は setup-auth-mock.ts で
// モックするため、URL/KEY はダミーで良い。ADMIN_EMAIL は認可判定に必須。
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'integration-placeholder-anon-key';
