import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/reports/[id]/route';
import {
  ADMIN_TOKEN,
  USER_TOKEN,
  disconnectDb,
  makeRequest,
  prisma,
  resetDb,
  routeContext,
  seedReport,
} from './helpers';

const url = (id: string) => `http://localhost/api/reports/${id}`;
const MISSING = '00000000-0000-0000-0000-000000000000';

describe('GET /api/reports/[id] (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('正常: 全文・タグ・外部URL を返す', async () => {
    const id = await seedReport({
      content: '# Full\n\nbody',
      tags: ['#AI'],
      externalUrls: [{ url: 'https://example.com', label: 'L' }],
    });
    const res = await GET(makeRequest(url(id)), routeContext(id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { content: string; tags: string[]; externalUrls: unknown[] };
    expect(body.content).toBe('# Full\n\nbody');
    expect(body.tags).toEqual(['#AI']);
    expect(body.externalUrls).toHaveLength(1);
    expect(res.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=300');
  });

  it('異常: 存在しない ID は 404', async () => {
    const res = await GET(makeRequest(url(MISSING)), routeContext(MISSING));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/reports/[id] (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('異常: 未認証 401 / 非管理者 403', async () => {
    const id = await seedReport();
    const unauth = await PATCH(makeRequest(url(id), { method: 'PATCH', body: { title: 'x' } }), routeContext(id));
    expect(unauth.status).toBe(401);
    const forbidden = await PATCH(
      makeRequest(url(id), { method: 'PATCH', body: { title: 'x' }, token: USER_TOKEN }),
      routeContext(id),
    );
    expect(forbidden.status).toBe(403);
  });

  it('準正常: 不正カテゴリは 400', async () => {
    const id = await seedReport();
    const res = await PATCH(
      makeRequest(url(id), { method: 'PATCH', body: { category: 'Nope' }, token: ADMIN_TOKEN }),
      routeContext(id),
    );
    expect(res.status).toBe(400);
  });

  it('異常: 存在しない ID は 404（P2025）', async () => {
    const res = await PATCH(
      makeRequest(url(MISSING), { method: 'PATCH', body: { title: 'x' }, token: ADMIN_TOKEN }),
      routeContext(MISSING),
    );
    expect(res.status).toBe(404);
  });

  it('正常: 部分更新（title のみ）は他フィールドを保持', async () => {
    const id = await seedReport({ title: 'Old', author: 'Keep', content: 'KeepBody' });
    const res = await PATCH(
      makeRequest(url(id), { method: 'PATCH', body: { title: 'Updated' }, token: ADMIN_TOKEN }),
      routeContext(id),
    );
    expect(res.status).toBe(200);
    const inDb = await prisma.report.findUnique({ where: { id } });
    expect(inDb!.title).toBe('Updated');
    expect(inDb!.author).toBe('Keep');
    expect(inDb!.content).toBe('KeepBody');
  });

  it('正常: tags は置換セマンティクス（[A,B] → [B,C]）', async () => {
    const id = await seedReport({ tags: ['#A', '#B'] });
    const res = await PATCH(
      makeRequest(url(id), { method: 'PATCH', body: { tags: ['B', 'C'] }, token: ADMIN_TOKEN }),
      routeContext(id),
    );
    expect(res.status).toBe(200);
    const mappings = await prisma.reportTagMapping.findMany({
      where: { reportId: id },
      include: { ReportTag: true },
    });
    expect(mappings.map((m) => m.ReportTag.name).sort()).toEqual(['#B', '#C']);
  });

  it('正常: externalUrls を空配列で全削除', async () => {
    const id = await seedReport({ externalUrls: [{ url: 'https://a.com' }, { url: 'https://b.com' }] });
    const res = await PATCH(
      makeRequest(url(id), { method: 'PATCH', body: { externalUrls: [] }, token: ADMIN_TOKEN }),
      routeContext(id),
    );
    expect(res.status).toBe(200);
    expect(await prisma.externalUrl.count({ where: { reportId: id } })).toBe(0);
  });
});

describe('DELETE /api/reports/[id] (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('異常: 未認証 401 / 非管理者 403', async () => {
    const id = await seedReport();
    expect((await DELETE(makeRequest(url(id), { method: 'DELETE' }), routeContext(id))).status).toBe(401);
    expect(
      (await DELETE(makeRequest(url(id), { method: 'DELETE', token: USER_TOKEN }), routeContext(id))).status,
    ).toBe(403);
  });

  it('異常: 存在しない ID は 404', async () => {
    const res = await DELETE(
      makeRequest(url(MISSING), { method: 'DELETE', token: ADMIN_TOKEN }),
      routeContext(MISSING),
    );
    expect(res.status).toBe(404);
  });

  it('正常: 削除で外部URL・タグマッピングが CASCADE 削除される（タグ自体は残る）', async () => {
    const id = await seedReport({
      tags: ['#AI'],
      externalUrls: [{ url: 'https://a.com' }],
    });
    const res = await DELETE(
      makeRequest(url(id), { method: 'DELETE', token: ADMIN_TOKEN }),
      routeContext(id),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(await prisma.report.count({ where: { id } })).toBe(0);
    expect(await prisma.externalUrl.count({ where: { reportId: id } })).toBe(0);
    expect(await prisma.reportTagMapping.count({ where: { reportId: id } })).toBe(0);
    expect(await prisma.reportTag.count()).toBe(1); // ReportTag はカスケード対象外
  });
});
