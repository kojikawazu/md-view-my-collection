import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/reports/route';
import {
  ADMIN_TOKEN,
  USER_TOKEN,
  disconnectDb,
  makeRequest,
  prisma,
  resetDb,
  seedReport,
} from './helpers';

const REPORTS_URL = 'http://localhost/api/reports';

const validBody = (over: Record<string, unknown> = {}) => ({
  title: 'New Report',
  content: '# Body\n\ncontent',
  category: 'AI',
  author: 'Author',
  summary: 'summary',
  tags: ['AI', 'UIUX'],
  ...over,
});

describe('GET /api/reports (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('正常: 新しい順に一覧を返し content は空・x-total-count を付与', async () => {
    await seedReport({ title: 'Older', createdAt: new Date('2024-01-01T00:00:00Z') });
    await seedReport({ title: 'Newer', createdAt: new Date('2024-02-01T00:00:00Z') });

    const res = await GET(makeRequest(REPORTS_URL));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; content: string }[];

    expect(body.map((r) => r.title)).toEqual(['Newer', 'Older']);
    expect(body.every((r) => r.content === '')).toBe(true);
    expect(res.headers.get('x-total-count')).toBe('2');
    expect(res.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=300');
  });

  it('正常: limit/offset でページングし x-limit/x-offset を付与', async () => {
    await seedReport({ title: 'A', createdAt: new Date('2024-01-01T00:00:00Z') });
    await seedReport({ title: 'B', createdAt: new Date('2024-01-02T00:00:00Z') });
    await seedReport({ title: 'C', createdAt: new Date('2024-01-03T00:00:00Z') });

    const res = await GET(makeRequest(`${REPORTS_URL}?limit=2&offset=1`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string }[];

    // desc 順 [C,B,A] の offset=1,limit=2 → [B,A]
    expect(body.map((r) => r.title)).toEqual(['B', 'A']);
    expect(res.headers.get('x-total-count')).toBe('3');
    expect(res.headers.get('x-limit')).toBe('2');
    expect(res.headers.get('x-offset')).toBe('1');
  });

  it('準正常: 0件なら空配列 + x-total-count=0', async () => {
    const res = await GET(makeRequest(REPORTS_URL));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(res.headers.get('x-total-count')).toBe('0');
  });

  it('正常: タグと外部URLを含めて返す', async () => {
    await seedReport({
      tags: ['#AI'],
      externalUrls: [{ url: 'https://example.com', label: 'Note' }],
    });
    const res = await GET(makeRequest(REPORTS_URL));
    const [item] = (await res.json()) as {
      tags: string[];
      externalUrls: { url: string; label: string | null }[];
    }[];
    expect(item.tags).toEqual(['#AI']);
    expect(item.externalUrls).toEqual([{ id: expect.any(String), url: 'https://example.com', label: 'Note' }]);
  });
});

describe('POST /api/reports (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('異常: 未認証は 401', async () => {
    const res = await POST(makeRequest(REPORTS_URL, { method: 'POST', body: validBody() }));
    expect(res.status).toBe(401);
  });

  it('異常: 非管理者は 403', async () => {
    const res = await POST(
      makeRequest(REPORTS_URL, { method: 'POST', body: validBody(), token: USER_TOKEN }),
    );
    expect(res.status).toBe(403);
  });

  it('準正常: バリデーションエラーは 400（DB へ書き込まない）', async () => {
    const res = await POST(
      makeRequest(REPORTS_URL, {
        method: 'POST',
        body: validBody({ title: '', category: 'InvalidCat' }),
        token: ADMIN_TOKEN,
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { errors: Record<string, string> };
    expect(Object.keys(body.errors).length).toBeGreaterThan(0);
    expect(await prisma.report.count()).toBe(0);
  });

  it('正常: 201 でレポート作成・タグ upsert・外部URL 保存を実 DB で検証', async () => {
    const res = await POST(
      makeRequest(REPORTS_URL, {
        method: 'POST',
        body: validBody({
          tags: ['AI'],
          externalUrls: [{ url: 'https://zenn.dev/x', label: null }],
        }),
        token: ADMIN_TOKEN,
      }),
    );
    expect(res.status).toBe(201);
    const item = (await res.json()) as {
      id: string;
      content: string;
      tags: string[];
      externalUrls: { url: string }[];
    };
    expect(item.content).toBe('# Body\n\ncontent');
    expect(item.tags).toEqual(['#AI']); // normalizeTags で # 付与
    expect(item.externalUrls[0].url).toBe('https://zenn.dev/x');

    // 実 DB を直接検証
    const inDb = await prisma.report.findUnique({
      where: { id: item.id },
      include: { ReportTagMapping: { include: { ReportTag: true } }, ExternalUrl: true },
    });
    expect(inDb).not.toBeNull();
    expect(inDb!.ReportTagMapping.map((m) => m.ReportTag.name)).toEqual(['#AI']);
    expect(inDb!.ExternalUrl).toHaveLength(1);
  });

  it('正常: 既存タグは upsert で再利用（重複作成しない）', async () => {
    await seedReport({ tags: ['#AI'] });
    const before = await prisma.reportTag.count();
    expect(before).toBe(1);

    await POST(
      makeRequest(REPORTS_URL, {
        method: 'POST',
        body: validBody({ tags: ['AI'] }),
        token: ADMIN_TOKEN,
      }),
    );
    expect(await prisma.reportTag.count()).toBe(1); // #AI は再利用
  });
});
