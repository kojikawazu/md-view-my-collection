import { NextRequest, NextResponse } from 'next/server';
import type { Report, ReportTagMapping, ReportTag } from '@prisma/client';
import { prisma } from '@/lib/db';
import { validateReportInput } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-server';

type ReportWithTags = Report & {
  ReportTagMapping: (ReportTagMapping & { ReportTag: ReportTag })[];
};

const toReportItem = (report: ReportWithTags) => ({
  id: report.id,
  title: report.title,
  summary: report.summary ?? null,
  content: report.content,
  category: report.category,
  author: report.author,
  publishDate: report.publishDate?.toISOString() ?? null,
  createdAt: report.createdAt.toISOString(),
  updatedAt: report.updatedAt.toISOString(),
  tags: report.ReportTagMapping.map((m) => m.ReportTag.name),
});

const parseNumber = (value: string | null, range: { min?: number; max?: number } = {}) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const integer = Math.trunc(parsed);
  if (typeof range.min === 'number' && integer < range.min) return range.min;
  if (typeof range.max === 'number' && integer > range.max) return range.max;
  return integer;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseNumber(searchParams.get('limit'), { min: 1, max: 1000 });
    const offset = parseNumber(searchParams.get('offset'), { min: 0 }) ?? 0;

    const [totalCount, reports] = await prisma.$transaction([
      prisma.report.count(),
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        ...(limit !== undefined ? { take: limit } : {}),
        skip: offset,
        include: {
          ReportTagMapping: {
            include: { ReportTag: true },
          },
        },
      }),
    ]);

    const headers: Record<string, string> = {
      'x-total-count': String(totalCount),
    };
    if (limit !== undefined) {
      headers['x-limit'] = String(limit);
      headers['x-offset'] = String(offset);
    }

    return NextResponse.json(reports.map(toReportItem), { headers });
  } catch (error) {
    console.error('[api/reports] GET failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'api/reports');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { data, errors } = validateReportInput(body);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const tagNames = data.tags ?? [];

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          title: data.title ?? '',
          summary: data.summary ?? null,
          content: data.content ?? '',
          category: data.category ?? '',
          author: data.author ?? '',
          publishDate: data.publishDate ?? null,
        },
      });

      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          await tx.reportTag.upsert({
            where: { name: tagName },
            create: { id: crypto.randomUUID(), name: tagName },
            update: {},
          });
        }

        const tagRecords = await tx.reportTag.findMany({
          where: { name: { in: tagNames } },
        });

        await tx.reportTagMapping.createMany({
          data: tagRecords.map((tag) => ({
            id: crypto.randomUUID(),
            reportId: report.id,
            reportTagId: tag.id,
          })),
        });
      }

      return tx.report.findUniqueOrThrow({
        where: { id: report.id },
        include: {
          ReportTagMapping: {
            include: { ReportTag: true },
          },
        },
      });
    });

    return NextResponse.json(toReportItem(result), { status: 201 });
  } catch (error) {
    console.error('[api/reports] POST failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
