import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `lib/rate-limit.ts` は**モジュール読み込み時**に環境変数を見て有効/無効を決める。
// `vi.hoisted` は import 評価より前に走るため、ここで環境変数を与えて「有効」状態にする。
const { limitMock } = vi.hoisted(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  return { limitMock: vi.fn() };
});

// モックするのは Upstash（真の外部 3rd-party）だけ。ルートハンドラ・レートリミット実装・
// 認可ガードはすべて実物を通す（`.claude/rules/testing.md`）。
vi.mock('@upstash/redis', () => ({
  Redis: class {},
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => 'sliding-window');
    limit = limitMock;
  },
}));

import { GET as adminGet } from '@/app/api/auth/admin/route';
import { POST as isAllowedPost } from '@/app/api/auth/is-allowed/route';
import { POST as reportsPost } from '@/app/api/reports/route';
import { ADMIN_TOKEN, makeRequest } from './helpers';

const NOW = 1_700_000_000_000;

describe('レートリミット（integration）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    limitMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('正常: 上限内なら本来の処理に進む（認可ガードまで到達する）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW + 60_000 });

    const res = await adminGet(makeRequest('http://localhost/api/auth/admin'));

    // レートリミットを通過し、トークン欠落として 401 になる（429 ではない）
    expect(res.status).toBe(401);
  });

  it('異常: GET /api/auth/admin は上限超過で 429 を返す', async () => {
    limitMock.mockResolvedValue({ success: false, reset: NOW + 15_000 });

    const res = await adminGet(
      makeRequest('http://localhost/api/auth/admin', { token: ADMIN_TOKEN }),
    );

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('15');
    expect(await res.json()).toEqual({
      error: 'リクエストが多すぎます。時間をおいて再試行してください。',
    });
  });

  it('異常: POST /api/auth/is-allowed は上限超過で 429 を返す', async () => {
    limitMock.mockResolvedValue({ success: false, reset: NOW + 60_000 });

    const res = await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', {
        method: 'POST',
        body: { email: 'admin@example.com' },
      }),
    );

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('異常: 書き込み系は認可より前に 429 で弾く（Supabase を呼ばせない）', async () => {
    limitMock.mockResolvedValue({ success: false, reset: NOW + 5_000 });

    // 管理者トークンを付けていても、レートリミットが先に効く
    const res = await reportsPost(
      makeRequest('http://localhost/api/reports', {
        method: 'POST',
        body: { title: 'x', content: 'y', category: 'AI', author: 'a', tags: ['AI'] },
        token: ADMIN_TOKEN,
      }),
    );

    expect(res.status).toBe(429);
  });

  it('準正常: 対象ごとにカウンタを分ける（片方の消費が他方に波及しない）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW });

    await adminGet(makeRequest('http://localhost/api/auth/admin'));
    await isAllowedPost(
      makeRequest('http://localhost/api/auth/is-allowed', { method: 'POST', body: {} }),
    );

    // 同一 IP でも別インスタンス（別 prefix）の limit が呼ばれている
    expect(limitMock).toHaveBeenCalledTimes(2);
    expect(limitMock.mock.instances[0]).not.toBe(limitMock.mock.instances[1]);
  });
});
