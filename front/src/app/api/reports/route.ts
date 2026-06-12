import { NextRequest, NextResponse } from 'next/server';
import type { Report, ReportTagMapping, ReportTag, ExternalUrl } from '@prisma/client';
import { prisma } from '@/lib/db';
import { validateReportInput, validateExternalUrls } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-server';

type TagMapping = ReportTagMapping & { ReportTag: ReportTag };

type ReportListRow = Omit<Report, 'content'> & { ReportTagMapping: TagMapping[]; ExternalUrl: ExternalUrl[] };

const mapTags = (mappings: TagMapping[]) => mappings.map((m) => m.ReportTag.name);

const mapExternalUrls = (urls: ExternalUrl[]) =>
  urls.map((eu) => ({ id: eu.id, url: eu.url, label: eu.label }));

const toReportListItem = (report: ReportListRow) => ({
  id: report.id,
  title: report.title,
  summary: report.summary ?? null,
  content: '',
  category: report.category,
  author: report.author,
  publishDate: report.publishDate?.toISOString() ?? null,
  createdAt: report.createdAt.toISOString(),
  updatedAt: report.updatedAt.toISOString(),
  tags: mapTags(report.ReportTagMapping),
  externalUrls: mapExternalUrls(report.ExternalUrl),
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
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          author: true,
          publishDate: true,
          createdAt: true,
          updatedAt: true,
          ReportTagMapping: {
            include: { ReportTag: true },
          },
          ExternalUrl: true,
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

    headers['Cache-Control'] = 's-maxage=60, stale-while-revalidate=300';
    return NextResponse.json(reports.map(toReportListItem), { headers });
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
    const { data: externalUrls, errors: urlErrors } = validateExternalUrls(body.externalUrls);

    const allErrors = { ...errors, ...urlErrors };
    if (Object.keys(allErrors).length > 0) {
      return NextResponse.json({ errors: allErrors }, { status: 400 });
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

      const tagRecords: { id: string; name: string }[] = [];
      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          const tag = await tx.reportTag.upsert({
            where: { name: tagName },
            create: { id: crypto.randomUUID(), name: tagName },
            update: {},
            select: { id: true, name: true },
          });
          tagRecords.push(tag);
        }

        await tx.reportTagMapping.createMany({
          data: tagRecords.map((tag) => ({
            id: crypto.randomUUID(),
            reportId: report.id,
            reportTagId: tag.id,
          })),
        });
      }

      let euRecords: { id: string; url: string; label: string | null }[] = [];
      if (externalUrls.length > 0) {
        await tx.externalUrl.createMany({
          data: externalUrls.map((eu) => ({
            reportId: report.id,
            url: eu.url,
            label: eu.label || null,
          })),
        });
        euRecords = await tx.externalUrl.findMany({
          where: { reportId: report.id },
          select: { id: true, url: true, label: true },
        });
      }

      return { report, tags: tagRecords.map((t) => t.name), externalUrls: euRecords };
    });

    const item = {
      id: result.report.id,
      title: result.report.title,
      summary: result.report.summary ?? null,
      content: result.report.content,
      category: result.report.category,
      author: result.report.author,
      publishDate: result.report.publishDate?.toISOString() ?? null,
      createdAt: result.report.createdAt.toISOString(),
      updatedAt: result.report.updatedAt.toISOString(),
      tags: result.tags,
      externalUrls: result.externalUrls,
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[api/reports] POST failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
