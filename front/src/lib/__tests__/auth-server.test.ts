// @vitest-environment node
// NextRequest / NextResponse は undici 実装を前提にするため、happy-dom ではなく node で動かす。
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * `supabase.auth.getUser` のダブル。テストごとに戻り値を差し替え、呼び出し回数で
 * 「キャッシュが効いたか（Supabase への往復が省かれたか）」を判定する。
 * Supabase Auth は**真の外部 3rd-party**であり、UT ではモックしてよい（`.claude/rules/testing.md`）。
 */
const getUserMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));

/** 固定時刻（UNIX ミリ秒）。キャッシュ期限とトークンの `exp` をこれ基準で組み立てる。 */
const NOW = 1_700_000_000_000;
const ADMIN = 'admin@example.com';

/**
 * 指定した `exp` を持つ JWT 形式の文字列を作る。署名は検証されない（検証は Supabase の責務で、
 * ここではモックの `getUser` が代行する）ため、署名部はダミーでよい。
 *
 * @param expMs - 有効期限（UNIX ミリ秒）。JWT の `exp` は秒なので切り捨てて埋める
 * @param sub - トークンを区別するための任意値（同じ exp でも別トークンにしたいとき）
 * @returns `header.payload.signature` 形式のトークン
 */
const makeJwt = (expMs: number, sub = 'user-1') => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub, exp: Math.floor(expMs / 1000) })}.sig`;
};

/**
 * Bearer トークン付きのリクエストを作る。
 *
 * @param token - Authorization ヘッダに載せるトークン
 * @returns `requireAdmin` に渡すリクエスト
 */
const requestWith = (token: string) =>
  new NextRequest('http://localhost/api/reports', {
    headers: { authorization: `Bearer ${token}` },
  });

/** `getUser` を「検証成功・管理者」として応答させる。 */
const respondAsAdmin = () => {
  getUserMock.mockResolvedValue({ data: { user: { email: ADMIN } }, error: null });
};

/**
 * モジュールを読み直す。キャッシュ（Map）はモジュールスコープにあるため、テスト間で
 * 共有されないよう毎回新しいインスタンスを使う。
 *
 * @returns 読み込んだ `requireAdmin`
 */
const loadRequireAdmin = async () => {
  vi.resetModules();
  return (await import('@/lib/auth-server')).requireAdmin;
};

describe('requireAdmin のトークンキャッシュ', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubEnv('ADMIN_EMAIL', ADMIN);
    getUserMock.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('正常: 有効なトークンは 2 回目以降キャッシュで通り、Supabase を呼ばない', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    const second = await requireAdmin(requestWith(token), 'test');

    expect(second.ok).toBe(true);
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it('正常: exp が十分先でも、キャッシュは 5 分で切れて再検証する', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    vi.setSystemTime(NOW + 5 * 60 * 1000 + 1);
    await requireAdmin(requestWith(token), 'test');

    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it('正常: exp の直前まではキャッシュが効く', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    vi.setSystemTime(NOW + 59 * 1000);
    await requireAdmin(requestWith(token), 'test');

    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  // 以下 2 件が Issue #208 の本命。キャッシュ期限がトークンの exp を超えないこと。
  // 「再検証したか」と「失効トークンを拒むか」は別観点なので it を分ける（Issue #187）。
  it('異常: exp を過ぎたトークンはキャッシュが残っていても Supabase で再検証する', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    vi.setSystemTime(NOW + 61 * 1000);
    await requireAdmin(requestWith(token), 'test');

    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it('異常: exp を過ぎたトークンは、5 分以内でも通さない', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    vi.setSystemTime(NOW + 61 * 1000);
    // 実際の Supabase は期限切れトークンをエラーで返す
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'token expired' } });
    const result = await requireAdmin(requestWith(token), 'test');

    expect(result.ok).toBe(false);
  });

  it('準正常: exp を読めないトークン（JWT でない）はキャッシュせず毎回検証する', async () => {
    const requireAdmin = await loadRequireAdmin();
    respondAsAdmin();

    await requireAdmin(requestWith('opaque-token'), 'test');
    await requireAdmin(requestWith('opaque-token'), 'test');

    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it('準正常: payload が壊れた JWT はキャッシュせず毎回検証する', async () => {
    const requireAdmin = await loadRequireAdmin();
    respondAsAdmin();

    await requireAdmin(requestWith('header.not-base64-json.sig'), 'test');
    await requireAdmin(requestWith('header.not-base64-json.sig'), 'test');

    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it('準正常: キャッシュ中でも ADMIN_EMAIL から外れた管理者は 403', async () => {
    const requireAdmin = await loadRequireAdmin();
    const token = makeJwt(NOW + 60 * 60 * 1000);
    respondAsAdmin();

    await requireAdmin(requestWith(token), 'test');
    vi.stubEnv('ADMIN_EMAIL', 'someone-else@example.com');
    const result = await requireAdmin(requestWith(token), 'test');

    expect(result.ok ? 200 : result.response.status).toBe(403);
  });
});
