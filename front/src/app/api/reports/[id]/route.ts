import { NextRequest, NextResponse } from 'next/server';
import type { Report, ReportTagMapping, ReportTag, ExternalUrl } from '@prisma/client';
import { prisma } from '@/lib/db';
import { validateReportInput, validateExternalUrls } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-server';

type RouteParams = {
  params: Promise<{ id: string }>;
};

type ReportWithTags = Report & {
  ReportTagMapping: (ReportTagMapping & { ReportTag: ReportTag })[];
  ExternalUrl: ExternalUrl[];
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
  externalUrls: report.ExternalUrl.map((eu) => ({ id: eu.id, url: eu.url, label: eu.label })),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        ReportTagMapping: {
          include: { ReportTag: true },
        },
        ExternalUrl: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(toReportItem(report), {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[api/reports/[id]] GET failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request, 'api/reports/[id]');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { data, errors } = validateReportInput(body, { partial: true });
    const hasExternalUrls = Array.isArray(body.externalUrls);
    const { data: externalUrls, errors: urlErrors } = hasExternalUrls
      ? validateExternalUrls(body.externalUrls)
      : { data: [], errors: {} };

    const allErrors = { ...errors, ...urlErrors };
    if (Object.keys(allErrors).length > 0) {
      return NextResponse.json({ errors: allErrors }, { status: 400 });
    }

    const hasDataField = <T extends object, K extends keyof T>(target: T, key: K) =>
      Object.prototype.hasOwnProperty.call(target, key);

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id },
        data: {
          ...(hasDataField(data, 'title') ? { title: data.title } : {}),
          ...(hasDataField(data, 'summary') ? { summary: data.summary } : {}),
          ...(hasDataField(data, 'content') ? { content: data.content } : {}),
          ...(hasDataField(data, 'category') ? { category: data.category } : {}),
          ...(hasDataField(data, 'author') ? { author: data.author } : {}),
          ...(hasDataField(data, 'publishDate') ? { publishDate: data.publishDate ?? null } : {}),
        },
      });

      let tags: string[] | undefined;
      if (hasDataField(data, 'tags') && data.tags) {
        const tagNames = data.tags;

        await tx.reportTagMapping.deleteMany({ where: { reportId: id } });

        let tagRecords: { id: string; name: string }[] = [];
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
        tags = tagRecords.map((t) => t.name);
      }

      let euRecords: { id: string; url: string; label: string | null }[] | undefined;
      if (hasExternalUrls) {
        await tx.externalUrl.deleteMany({ where: { reportId: id } });
        if (externalUrls.length > 0) {
          await tx.externalUrl.createMany({
            data: externalUrls.map((eu) => ({
              reportId: id,
              url: eu.url,
              label: eu.label || null,
            })),
          });
        }
        euRecords = await tx.externalUrl.findMany({
          where: { reportId: id },
          select: { id: true, url: true, label: true },
        });
      }

      return { report, tags, externalUrls: euRecords };
    });

    const tags =
      result.tags ??
      (
        await prisma.reportTagMapping.findMany({
          where: { reportId: id },
          include: { ReportTag: true },
        })
      ).map((m) => m.ReportTag.name);

    const euList =
      result.externalUrls ??
      (
        await prisma.externalUrl.findMany({
          where: { reportId: id },
          select: { id: true, url: true, label: true },
        })
      );

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
      tags,
      externalUrls: euList,
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error('[api/reports/[id]] PATCH failed', error);
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request, 'api/reports/[id]');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/reports/[id]] DELETE failed', error);
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
