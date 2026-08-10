// タグ（`/api/tags`）へのアクセス。

import { requestJson } from '@/repositories/client';

/**
 * サイドバーのフィルタ候補となるタグ一覧を取得する。
 *
 * 返るタグは `#` 付きが canonical form（`schemas/report.ts` の `normalizeTags` に準拠）。
 *
 * @returns タグ一覧
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchTags = (): Promise<string[]> => requestJson<string[]>('/api/tags');
