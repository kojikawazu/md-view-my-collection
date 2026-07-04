import { inject } from 'vitest';

// 各ワーカーで、テスト本体（および Prisma シングルトン `@/lib/db` の import）より前に
// DATABASE_URL をテストコンテナの接続先へ確定させる。
process.env.DATABASE_URL = inject('databaseUrl');

// requireAdmin / auth ルートが参照する env。Supabase 呼び出し自体は setup-auth-mock.ts で
// モックするため、URL/KEY はダミーで良い。ADMIN_EMAIL は認可判定に必須。
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'integration-placeholder-anon-key';
