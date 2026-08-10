import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, requestJson, requestVoid } from '@/repositories/client';

/** `responseDouble` に渡す応答の指定。 */
type ResponseDoubleInit = {
  /** 2xx 相当なら true */
  ok: boolean;
  /** HTTP ステータスコード */
  status: number;
  /** 応答ボディ。省略すると JSON パース失敗（非 JSON 応答）を再現する */
  json?: () => Promise<unknown>;
};

/**
 * `fetch` の戻り値として使う最小限の Response ダブル。
 *
 * 実際に使うのは `ok` / `status` / `json()` の 3 つだけで、`Response` の実型は
 * 構造的にはるかに大きいため、二段キャストで隙間を埋める（実行時は使う分だけで足りる）。
 *
 * @param init - 応答の成否・ステータス・ボディ
 * @returns `fetch` の解決値として使えるダブル
 */
const responseDouble = (init: ResponseDoubleInit) =>
  ({
    ok: init.ok,
    status: init.status,
    json: init.json ?? (() => Promise.reject(new Error('not json'))),
  }) as unknown as Response;

describe('repositories/client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  // --- 正常系 ---

  it('should return parsed JSON on success (C-N-1)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({ ok: true, status: 200, json: async () => ({ id: 'r1' }) }),
    );

    await expect(requestJson<{ id: string }>('/api/reports/r1')).resolves.toEqual({ id: 'r1' });
    expect(fetch).toHaveBeenCalledWith('/api/reports/r1', {
      method: 'GET',
      headers: {},
    });
  });

  it('should send Authorization and Content-Type when token and body are given (C-N-2)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({ ok: true, status: 201, json: async () => ({ id: 'r1' }) }),
    );

    await requestJson('/api/reports', { method: 'POST', body: { title: 'x' }, token: 't0ken' });

    expect(fetch).toHaveBeenCalledWith('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t0ken' },
      body: JSON.stringify({ title: 'x' }),
    });
  });

  it('should resolve without reading the body via requestVoid (C-N-3)', async () => {
    const json = vi.fn();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({ ok: true, status: 204, json }),
    );

    await expect(requestVoid('/api/reports/r1', { method: 'DELETE' })).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  // --- 準正常系（サーバーが非 2xx を返した） ---

  it('should throw ApiError carrying status and error body (C-S-1)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({
        ok: false,
        status: 400,
        json: async () => ({ error: '入力が不正です', errors: { title: '必須です' } }),
      }),
    );

    const error = await requestJson('/api/reports', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).body).toEqual({
      error: '入力が不正です',
      errors: { title: '必須です' },
    });
  });

  it('should throw ApiError with empty body when the response is not JSON (C-S-2)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({ ok: false, status: 500 }),
    );

    const error = await requestJson('/api/reports').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).body).toEqual({});
  });

  it('should omit the Authorization header when the token is null (C-S-3)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      responseDouble({ ok: true, status: 200, json: async () => [] }),
    );

    await requestJson('/api/reports', { token: null });

    expect(fetch).toHaveBeenCalledWith('/api/reports', { method: 'GET', headers: {} });
  });

  // --- 異常系（通信そのものが失敗した） ---

  it('should propagate a network failure as a non-ApiError (C-A-1)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await requestJson('/api/reports').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
