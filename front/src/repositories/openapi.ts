// OpenAPI ドキュメント（`/api/openapi`・管理者のみ）へのアクセス。

import { requestJson } from '@/repositories/client';

/**
 * Swagger UI へ渡す OpenAPI スペックを取得する。
 *
 * 管理者ゲート付きエンドポイントのため Bearer トークンが必須。スペックの構造は
 * Swagger UI へそのまま渡すだけなので、型は `object` に留める。
 *
 * @param token - Supabase セッションのアクセストークン
 * @returns OpenAPI 3.1 ドキュメント
 * @throws {ApiError} 非 2xx が返った場合（非管理者は 401 / 403）
 */
export const fetchOpenApiSpec = (token: string): Promise<object> =>
  requestJson<object>('/api/openapi', { token });
