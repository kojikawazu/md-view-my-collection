import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/tags/route';
import { disconnectDb, resetDb, seedReport } from './helpers';

describe('GET /api/tags (integration)', () => {
  beforeEach(resetDb);
  afterAll(disconnectDb);

  it('正常: タグ名を昇順・重複なしで返す', async () => {
    await seedReport({ tags: ['#Zeta', '#Alpha'] });
    await seedReport({ tags: ['#Alpha', '#Mid'] }); // #Alpha は既存を再利用（unique name）

    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as string[];
    expect(body).toEqual(['#Alpha', '#Mid', '#Zeta']);
  });

  it('準正常: タグが無ければ空配列を返す', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('キャッシュヘッダを付与する', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=300');
  });
});
