import { afterEach, describe, expect, it, vi } from 'vitest';
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

  // 許可・拒否は別々の判定分岐。同じ it に置くと、先に評価される許可側が落ちた時点で
  // 「許可していないメールを拒む」という本命の観点が一度も評価されない（Issue #187）。
  it('local モード: body.email が ADMIN_EMAIL 一致なら allowed=true', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'local';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: { email: 'admin@example.com' },
      }),
    );
    expect(await res.json()).toEqual({ allowed: true });
  });

  it('local モード: body.email が ADMIN_EMAIL 不一致なら allowed=false', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'local';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: { email: 'someone@else.com' },
      }),
    );
    expect(await res.json()).toEqual({ allowed: false });
  });

  it('supabase モード: トークンなしは 401', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'supabase';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', { method: 'POST', body: {} }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ allowed: false });
  });

  it('supabase モード: 管理者トークンは allowed=true', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'supabase';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: {},
        token: ADMIN_TOKEN,
      }),
    );
    expect(await res.json()).toEqual({ allowed: true });
  });

  it('supabase モード: 非管理者トークンは allowed=false', async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = 'supabase';
    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: {},
        token: USER_TOKEN,
      }),
    );
    expect(await res.json()).toEqual({ allowed: false });
  });

  // Issue #207: E2E 用の local 指定が本番ビルドに紛れ込んでも、トークン検証を省略しない。
  // 「トークンを要求する」と「ボディのメールを信用しない」は別の観点なので it を分ける（Issue #187）。
  describe('本番（NODE_ENV=production）で local 指定', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('異常: 管理者メールを body で送ってもトークンなしは 401', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      process.env.NEXT_PUBLIC_AUTH_MODE = 'local';
      const res = await isAllowedPost(
        makeRequest('http://localhost/api/auth/is-allowed', {
          method: 'POST',
          body: { email: 'admin@example.com' },
        }),
      );
      expect(res.status).toBe(401);
    });

    it('異常: 非管理者トークンなら body の管理者メールは無視され allowed=false', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      process.env.NEXT_PUBLIC_AUTH_MODE = 'local';
      const res = await isAllowedPost(
        makeRequest('http://localhost/api/auth/is-allowed', {
          method: 'POST',
          body: { email: 'admin@example.com' },
          token: USER_TOKEN,
        }),
      );
      expect(await res.json()).toEqual({ allowed: false });
    });
  });
});
