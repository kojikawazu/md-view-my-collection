// BFF（`/api/*`）へのアクセスを担う repositories 層の共通クライアント。
// `fetch` を書いてよいのは repositories だけ（`.claude/rules/frontend.md`）。
// 認証ヘッダの付与・非 2xx の例外化をここに閉じ、各リポジトリ関数は URL とペイロードだけを扱う。

/**
 * BFF がエラー応答で返す JSON の形。
 *
 * `error` はクライアント向けメッセージ、`errors` はバリデーション失敗時の
 * フィールド別メッセージ（フィールド名 → 日本語メッセージ）。
 * いずれもエンドポイント・失敗種別により欠落しうるため任意。
 */
type ApiErrorBody = {
  /** クライアント向けエラーメッセージ */
  error?: string;
  /** バリデーション失敗時のフィールド別メッセージ */
  errors?: Record<string, string>;
};

/**
 * BFF が非 2xx を返したことを表すエラー。
 *
 * 通信自体の失敗（ネットワーク断・CORS 等）とは区別する。呼び出し側は
 * `instanceof ApiError` で分岐し、`status` / `body` を UI 向けの結果へ変換する。
 */
export class ApiError extends Error {
  /**
   * @param status - HTTP ステータスコード
   * @param body - 応答ボディ。JSON でない場合は空オブジェクト
   */
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody = {},
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

/**
 * Bearer トークンの Authorization ヘッダを組み立てる。
 *
 * トークンが無い場合は空オブジェクトを返し、ヘッダ自体を送らない
 * （`Bearer null` のような不正値をサーバーへ渡さないため）。
 *
 * @param token - Supabase セッションのアクセストークン。未取得時は null / undefined
 * @returns Authorization ヘッダを含む（または空の）ヘッダオブジェクト
 */
const authHeaders = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

/**
 * BFF へのリクエスト指定。
 */
type RequestOptions = {
  /** HTTP メソッド。省略時は GET */
  method?: string;
  /** JSON 化して送るリクエストボディ。省略時は Content-Type ごと送らない */
  body?: unknown;
  /** Bearer 認証に使うアクセストークン。未取得時は null */
  token?: string | null;
};

/**
 * BFF へリクエストし、成功時のみ応答を返す。
 *
 * @param path - `/api/` 配下のパス
 * @param options - メソッド・ボディ・トークンの指定
 * @returns 成功応答の `Response`
 * @throws {ApiError} 非 2xx が返った場合
 */
const request = async (path: string, options: RequestOptions = {}): Promise<Response> => {
  const { method = 'GET', body, token } = options;
  const res = await fetch(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(token),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(res.status, errorBody);
  }
  return res;
};

/**
 * BFF へリクエストし、JSON をパースして返す。
 *
 * @param path - `/api/` 配下のパス
 * @param options - `request` と同じ
 * @returns パース済みの応答ボディ
 * @throws {ApiError} 非 2xx が返った場合
 */
export const requestJson = async <T>(path: string, options?: RequestOptions): Promise<T> => {
  const res = await request(path, options);
  return (await res.json()) as T;
};

/**
 * BFF へリクエストし、応答ボディを読み捨てる。
 *
 * 削除のように「成功したこと」だけが必要な操作に使う。
 *
 * @param path - `/api/` 配下のパス
 * @param options - `request` と同じ
 * @throws {ApiError} 非 2xx が返った場合
 */
export const requestVoid = async (path: string, options?: RequestOptions): Promise<void> => {
  await request(path, options);
};
