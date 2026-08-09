import { afterEach, describe, expect, it } from 'vitest';
import { GET as adminGet } from '@/app/api/auth/admin/route';
import { POST as isAllowedPost } from '@/app/api/auth/is-allowed/route';
import { ADMIN_TOKEN, USER_TOKEN, makeRequest } from './helpers';

// これらのルートは DB を使わない（Supabase Auth のみ）。実 DB は不要だが IT スイートに同居させる。

describe('GET /api/auth/admin (integration)', () => {
  it('異常: 認証ヘッダなしは 401 {isAdmin:false}', async () => {
    const res = await adminGet(makeRequest('http://localhost/api/auth/admin'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ isAdmin: false });
  });

  it('正常: 管理者トークンは {isAdmin:true}', async () => {
    const res = await adminGet(
      makeRequest('http://localhost/api/auth/admin', { token: ADMIN_TOKEN }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isAdmin: true });
  });

  it('準正常: 非管理者トークンは {isAdmin:false}（200）', async () => {
    const res = await adminGet(
      makeRequest('http://localhost/api/auth/admin', { token: USER_TOKEN }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isAdmin: false });
  });

  it('異常: 無効トークンは 401', async () => {
    const res = await adminGet(makeRequest('http://localhost/api/auth/admin', { token: 'bogus' }));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/is-allowed (integration)', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_AUTH_MODE;
  });

  it('local モード: body.email が ADMIN_EMAIL 一致なら allowed=true', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'local';
    const ok = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: { email: 'admin@example.com' },
      }),
    );
    expect(await ok.json()).toEqual({ allowed: true });

    const ng = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: { email: 'someone@else.com' },
      }),
    );
    expect(await ng.json()).toEqual({ allowed: false });
  });

  it('supabase モード: トークンなしは 401', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'supabase';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', { method: 'POST', body: {} }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ allowed: false });
  });

  it('supabase モード: 管理者トークンは allowed=true / 非管理者は false', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'supabase';
    const admin = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: {},
        token: ADMIN_TOKEN,
      }),
    );
    expect(await admin.json()).toEqual({ allowed: true });

    const user = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: {},
        token: USER_TOKEN,
      }),
    );
    expect(await user.json()).toEqual({ allowed: false });
  });
});
