// Prisma Client のシングルトン。全 API ルートはこのインスタンスを共有する。
//
// globalThis にキャッシュして再利用するのが肝:
//   - 開発時: Next.js のホットリロードでモジュールが再評価されるたびに新しい接続が生まれ、
//     Postgres の接続数が枯渇するのを防ぐ。
//   - 本番時: サーバーレスのウォーム起動間でインスタンスを使い回し、コールドスタート時の
//     DB 再接続コストを削減する（`.claude/rules/database.md` の方針）。

import { PrismaClient } from '@prisma/client';

/** グローバルに Prisma シングルトンを退避するための型拡張。 */
type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

/**
 * アプリ全体で共有する Prisma Client。
 *
 * 既にグローバルへ格納済みならそれを再利用し、無ければ生成する。
 * ログは `error` のみに絞り、正常クエリのノイズを出さない。
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

globalForPrisma.prisma = prisma;
