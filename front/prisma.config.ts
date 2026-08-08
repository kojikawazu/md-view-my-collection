import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// このファイルは Prisma CLI の全サブコマンドで読み込まれる。`.env.local` を明示的に読むため、
// ここで解決される接続先は **本番 Supabase** になる（開発用 Supabase 環境は存在しない）。
// 正当な用途は `prisma db pull`（DB 側で管理されているスキーマの取り込み）と
// `prisma generate` / `migrate diff`（DB へ接続しない）に限られる。
// 破壊的サブコマンド（`db push` / `migrate reset` / `migrate dev` / `migrate deploy`）は
// `.claude/rules/production-data.md` および `database.md` で禁止されている。
config({ path: '.env.local' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // フォールバックは削除しない。`postinstall` の `prisma generate` は `.env.local` が
    // 無い環境（CI・クリーンチェックアウト直後）でも走る必要があり、Prisma は url が
    // 未解決だと起動前に失敗するため。
    //
    // なお、これは事故の原因となった `環境変数 ?? ローカル既定` とは向きが逆で安全側に倒れる。
    // 事故のパターンは「テスト用の接続先を決める際に、値が入っていれば本番を採用してしまう」もの。
    // ここは「本番を使うのが正（db pull）で、取れないときだけ接続不能な placeholder に落ちる」。
    // テスト用の接続先解決はこの経路を一切使わない（`tests/support/db-target.ts`）。
    url:
      process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
