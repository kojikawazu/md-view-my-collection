import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `Ratelimit#limit` のダブル。テストごとに戻り値を差し替える。
 * Upstash は**真の外部 3rd-party**であり、UT ではモックしてよい（`.claude/rules/testing.md`）。
 */
const limitMock = vi.fn();

vi.mock('@upstash/redis', () => ({
  // 実接続は張らない。`checkRateLimit` は「クライアントが作れたか」だけを見る。
  Redis: class {},
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => 'sliding-window');
    limit = limitMock;
  },
}));

/** 固定時刻。`retryAfterSeconds` は `reset - Date.now()` から計算されるため基準を固定する。 */
const NOW = 1_700_000_000_000;

/**
 * 環境変数を設定し直してモジュールを読み込む。
 *
 * `lib/rate-limit.ts` は**モジュール読み込み時**に環境変数を見て有効/無効を決めるため、
 * 設定を変えるたびにモジュールキャッシュを捨てて読み直す必要がある。
 *
 * @param enabled - Upstash の環境変数を与えるか（false で「未設定」を再現）
 * @returns 読み込んだモジュール
 */
const loadModule = async (enabled: boolean) => {
  vi.resetModules();
  vi.stubEnv('UPSTASH_REDIS_REST_URL', enabled ? 'https://example.upstash.io' : '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', enabled ? 'token' : '');
  return await import('@/lib/rate-limit');
};

/**
 * 送信元 IP ヘッダーを持つリクエストを作る。
 *
 * @param headers - 付与するヘッダー
 * @returns 判定対象のリクエスト
 */
const makeRequest = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/auth/admin', { headers });

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    limitMock.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // --- 正常系 ---

  it('正常: 上限内なら通す（RL-N-1）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW + 60_000 });
    const { checkRateLimit } = await loadModule(true);

    await expect(checkRateLimit('auth-admin', makeRequest())).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  it('正常: x-forwarded-for の左端を識別子に使う（RL-N-2）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW });
    const { checkRateLimit } = await loadModule(true);

    await checkRateLimit('auth-admin', makeRequest({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }));

    // 連なったプロキシではなく、元のクライアント IP でカウントする
    expect(limitMock).toHaveBeenCalledWith('203.0.113.9');
  });

  it('正常: x-forwarded-for が無ければ x-real-ip を使う（RL-N-3）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW });
    const { checkRateLimit } = await loadModule(true);

    await checkRateLimit('auth-admin', makeRequest({ 'x-real-ip': '198.51.100.7' }));

    expect(limitMock).toHaveBeenCalledWith('198.51.100.7');
  });

  // --- 準正常系 ---

  it('準正常: 上限超過なら通さず再試行秒数を返す（RL-S-1）', async () => {
    limitMock.mockResolvedValue({ success: false, reset: NOW + 30_000 });
    const { checkRateLimit } = await loadModule(true);

    await expect(checkRateLimit('auth-is-allowed', makeRequest())).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 30,
    });
  });

  it('準正常: reset が過去でも再試行秒数は 1 以上（RL-S-2）', async () => {
    // ウィンドウが既に空いている端境では `reset - now` が 0 以下になりうる。
    // `Retry-After: 0` は「すぐ再試行してよい」の意味になり、上限超過の応答と矛盾する。
    limitMock.mockResolvedValue({ success: false, reset: NOW - 5_000 });
    const { checkRateLimit } = await loadModule(true);

    await expect(checkRateLimit('auth-admin', makeRequest())).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it('準正常: 送信元 IP が分からなければ unknown バケットに寄せる（RL-S-3）', async () => {
    limitMock.mockResolvedValue({ success: true, reset: NOW });
    const { checkRateLimit } = await loadModule(true);

    await checkRateLimit('auth-admin', makeRequest());

    // フェイルオープン（無制限に通す）にしない。ヘッダー欠落を総当たりの抜け道にしないため
    expect(limitMock).toHaveBeenCalledWith('unknown');
  });

  // --- 異常系 ---

  it('異常: 環境変数が未設定なら無効化して通す（RL-A-1）', async () => {
    const { checkRateLimit } = await loadModule(false);

    await expect(checkRateLimit('auth-admin', makeRequest())).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    // 無効であることは 1 度だけ警告する（毎回出すとログが埋まり、事実が見えなくなる）
    expect(console.warn).toHaveBeenCalledTimes(1);
    await checkRateLimit('auth-admin', makeRequest());
    expect(console.warn).toHaveBeenCalledTimes(1);
    // 無効時は Upstash を一切呼ばない
    expect(limitMock).not.toHaveBeenCalled();
  });

  it('異常: Upstash が失敗したら通す（可用性を優先する / RL-A-2）', async () => {
    limitMock.mockRejectedValue(new Error('upstash down'));
    const { checkRateLimit } = await loadModule(true);

    // レートリミットの障害でログイン自体を止める方が損害が大きい
    await expect(checkRateLimit('auth-admin', makeRequest())).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(console.error).toHaveBeenCalled();
  });
});

describe('rateLimitResponse', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('正常: 429 と Retry-After と統一エラー形式を返す（RL-N-4）', async () => {
    const { rateLimitResponse } = await loadModule(true);

    const res = rateLimitResponse({ allowed: false, retryAfterSeconds: 42 });

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    // `{ error: string }` に揃える（.claude/rules/error-handling.md）
    await expect(res.json()).resolves.toEqual({
      error: 'リクエストが多すぎます。時間をおいて再試行してください。',
    });
  });
});
