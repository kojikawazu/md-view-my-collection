import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export { prisma };

/** setup-auth-mock.ts の規約に対応するトークン。 */
export const ADMIN_TOKEN = 'admin-token';
export const USER_TOKEN = 'user-token';

/** 全テーブルを空にする（テスト間の分離。CASCADE + RESTART IDENTITY）。 */
export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ReportTagMapping", "ExternalUrl", "ReportTag", "Report" RESTART IDENTITY CASCADE',
  );
}

/** テスト終了時に Prisma 接続を閉じる。 */
export async function disconnectDb() {
  await prisma.$disconnect();
}

type RequestInitLite = {
  method?: string;
  body?: unknown;
  token?: string;
};

/**
 * ルートハンドラへ渡す NextRequest を組み立てる。
 *
 * @param url - リクエスト URL（クエリ含む）
 * @param init - method / JSON body / Bearer トークン
 * @returns 構築済み NextRequest
 */
export function makeRequest(url: string, { method = 'GET', body, token }: RequestInitLite = {}) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers['authorization'] = `Bearer ${token}`;
  return new NextRequest(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

/** `[id]` 系ルートの第2引数（params は Promise）。 */
export function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

/**
 * 直接 Prisma でレポートを1件作成する（GET/PATCH/DELETE の前提データ用）。
 *
 * @param overrides - フィールド上書き（tags / externalUrls も指定可）
 * @returns 作成した Report の id
 */
export async function seedReport(
  overrides: {
    title?: string;
    content?: string;
    category?: string;
    author?: string;
    summary?: string | null;
    tags?: string[];
    externalUrls?: { url: string; label?: string | null }[];
    createdAt?: Date;
  } = {},
) {
  const report = await prisma.report.create({
    data: {
      title: overrides.title ?? 'Seed Report',
      content: overrides.content ?? '# Seed\n\nbody',
      category: overrides.category ?? 'AI',
      author: overrides.author ?? 'Seed Author',
      summary: overrides.summary ?? 'seed summary',
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    },
  });

  for (const name of overrides.tags ?? []) {
    const tag = await prisma.reportTag.upsert({
      where: { name },
      create: { id: crypto.randomUUID(), name },
      update: {},
    });
    await prisma.reportTagMapping.create({
      data: { id: crypto.randomUUID(), reportId: report.id, reportTagId: tag.id },
    });
  }

  for (const eu of overrides.externalUrls ?? []) {
    await prisma.externalUrl.create({
      data: { reportId: report.id, url: eu.url, label: eu.label ?? null },
    });
  }

  return report.id;
}
