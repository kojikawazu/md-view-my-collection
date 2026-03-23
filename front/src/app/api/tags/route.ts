import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const tags = await prisma.reportTag.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return NextResponse.json(tags.map((t) => t.name), {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[api/tags] GET failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
