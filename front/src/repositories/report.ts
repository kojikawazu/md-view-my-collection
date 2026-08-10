// レポート（`/api/reports`）へのアクセス。状態管理・画面遷移は呼び出し側（provider / hooks）の責務とし、
// ここでは HTTP のやり取りだけを行う。

import { requestJson, requestVoid } from '@/repositories/client';
import type { ReportItem } from '@/types/report';

/**
 * レポート一覧を取得する。
 *
 * 転送量削減のため、一覧 API は本文（`content`）を含まない軽量版を返す。
 *
 * @returns レポート一覧
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchReports = (): Promise<ReportItem[]> => requestJson<ReportItem[]>('/api/reports');

/**
 * レポート 1 件を本文込みで取得する。
 *
 * @param id - 取得対象レポートの ID
 * @returns 本文を含むレポート
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchReport = (id: string): Promise<ReportItem> =>
  requestJson<ReportItem>(`/api/reports/${id}`);

/**
 * レポートを新規作成する。
 *
 * @param report - id を除いたレポート入力値
 * @param token - Bearer 認証に使うアクセストークン
 * @returns 作成されたレポート（サーバー採番の ID を含む）
 * @throws {ApiError} 非 2xx が返った場合
 */
export const createReport = (
  report: Omit<ReportItem, 'id'>,
  token: string | null,
): Promise<ReportItem> =>
  requestJson<ReportItem>('/api/reports', { method: 'POST', body: report, token });

/**
 * レポートを部分更新する。
 *
 * @param id - 更新対象レポートの ID
 * @param updatedData - 変更したいフィールドのみを含む部分オブジェクト
 * @param token - Bearer 認証に使うアクセストークン
 * @returns 更新後のレポート
 * @throws {ApiError} 非 2xx が返った場合
 */
export const updateReport = (
  id: string,
  updatedData: Partial<ReportItem>,
  token: string | null,
): Promise<ReportItem> =>
  requestJson<ReportItem>(`/api/reports/${id}`, { method: 'PATCH', body: updatedData, token });

/**
 * レポートを削除する。
 *
 * @param id - 削除対象レポートの ID
 * @param token - Bearer 認証に使うアクセストークン
 * @returns 削除完了を表す Promise（応答ボディは使わない）
 * @throws {ApiError} 非 2xx が返った場合
 */
export const deleteReport = (id: string, token: string | null): Promise<void> =>
  requestVoid(`/api/reports/${id}`, { method: 'DELETE', token });
