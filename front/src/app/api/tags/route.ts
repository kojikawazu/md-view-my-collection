import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * タグ名の一覧を昇順で返す（公開・認可不要）。
 *
 * レスポンスは CDN キャッシュ（`s-maxage=60, stale-while-revalidate=300`）を付与する。
 *
 * @returns タグ名文字列の配列 JSON。失敗時は 500 で `{ error }`
 */
export async function GET() {
  try {
    const tags = await prisma.reportTag.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return NextResponse.json(
      tags.map((t) => t.name),
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      },
    );
  } catch (error) {
    console.error('[api/tags] GET failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
