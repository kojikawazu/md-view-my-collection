import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/openapi/route';
import { ADMIN_TOKEN, USER_TOKEN, makeRequest } from './helpers';

// requireAdmin ゲートの検証（DB は使わない）。
describe('GET /api/openapi (integration)', () => {
  const url = 'http://localhost/api/openapi';

  it('異常: 未認証は 401', async () => {
    const res = await GET(makeRequest(url));
    expect(res.status).toBe(401);
  });

  it('異常: 非管理者は 403', async () => {
    const res = await GET(makeRequest(url, { token: USER_TOKEN }));
    expect(res.status).toBe(403);
  });

  it('正常: 管理者は OpenAPI ドキュメントを返す', async () => {
    const res = await GET(makeRequest(url, { token: ADMIN_TOKEN }));
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { openapi?: string; paths?: Record<string, unknown> };
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.paths).toBeTruthy();
  });
});
