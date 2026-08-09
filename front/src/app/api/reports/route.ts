import { NextRequest, NextResponse } from 'next/server';
import type { Report, ReportTagMapping, ReportTag, ExternalUrl } from '@prisma/client';
import { prisma } from '@/lib/db';
import { validateReportInput, validateExternalUrls } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-server';

/** タグマッピング行に、関連する `ReportTag` を結合した型。 */
type TagMapping = ReportTagMapping & { ReportTag: ReportTag };

/** 一覧取得用の Report 行。本文（content）は省き、タグと外部 URL を結合した型。 */
type ReportListRow = Omit<Report, 'content'> & {
  ReportTagMapping: TagMapping[];
  ExternalUrl: ExternalUrl[];
};

/**
 * タグマッピングの配列からタグ名だけを取り出す。
 *
 * @param mappings - `ReportTag` を結合済みのタグマッピング配列
 * @returns タグ名の配列
 */
const mapTags = (mappings: TagMapping[]) => mappings.map((m) => m.ReportTag.name);

/**
 * 外部 URL の Prisma 行を API レスポンス形へ整形する。
 *
 * @param urls - 外部 URL の Prisma 行配列
 * @returns `{ id, url, label }` に絞った配列
 */
const mapExternalUrls = (urls: ExternalUrl[]) =>
  urls.map((eu) => ({ id: eu.id, url: eu.url, label: eu.label }));

/**
 * 一覧用の Report 行を API レスポンス形へ整形する。
 *
 * 一覧では本文を返さないため `content` は空文字にし、日付は ISO 文字列へ変換する。
 *
 * @param report - タグ・外部 URL を結合済みの一覧用 Report 行
 * @returns 一覧項目としての Report オブジェクト
 */
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

/**
 * クエリ文字列を整数へ変換し、指定範囲にクランプする。
 *
 * 値が null・非数値なら undefined を返す。小数は切り捨て、`min`/`max` 指定時は
 * 範囲外の値を境界値へ丸める（不正な limit/offset で過大なクエリを投げないための防御）。
 *
 * @param value - クエリ文字列の生値（未指定なら null）
 * @param range - クランプ範囲
 * @param range.min - 下限値（任意）。これ未満は下限へ丸める
 * @param range.max - 上限値（任意）。これ超過は上限へ丸める
 * @returns クランプ済みの整数。変換不能なら undefined
 */
const parseNumber = (value: string | null, range: { min?: number; max?: number } = {}) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const integer = Math.trunc(parsed);
  if (typeof range.min === 'number' && integer < range.min) return range.min;
  if (typeof range.max === 'number' && integer > range.max) return range.max;
  return integer;
};

/**
 * レポート一覧を新しい順で返す（公開・認可不要）。
 *
 * クエリ `limit`（1〜1000）/ `offset`（0〜）でページングし、総件数を `x-total-count`、
 * limit 指定時は `x-limit`/`x-offset` をレスポンスヘッダに付与する。
 * レスポンスは CDN キャッシュ（`s-maxage=60, stale-while-revalidate=300`）を付与する。
 *
 * @param request - 受信リクエスト（URL のクエリで `limit`/`offset` を受け取る）
 * @returns 一覧項目の配列 JSON。失敗時は 500 で `{ error }`
 */
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

/**
 * レポートを新規作成する（管理者のみ）。
 *
 * 入力を zod で検証し、レポート本体・タグ（upsert してマッピング作成）・外部 URL を
 * 単一トランザクションで登録する。作成結果を整形して返す。
 *
 * @param request - 受信リクエスト（Authorization ヘッダで管理者判定、ボディに作成内容）
 * @returns 作成した Report を 201 で返す。認可失敗は 401/403、検証エラーは 400 で `{ errors }`、失敗時は 500
 */
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
