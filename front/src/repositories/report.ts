// レポート（`/api/reports`）へのアクセス。状態管理・画面遷移は呼び出し側（provider / hooks）の責務とし、
// ここでは HTTP のやり取りだけを行う。

import { requestJson, requestVoid } from '@/repositories/client';
import { parseReportItem, parseReportList } from '@/lib/report';
import type { ReportItem } from '@/types/report';

/**
 * 単一レポートの応答を検証して返す。
 *
 * 一覧と違い「壊れていたら捨てて続行」ができない（その 1 件が目的のため）ので、
 * 形が合わなければ例外にして呼び出し側のエラー処理へ倒す。
 *
 * @param value - 検証前の応答ボディ
 * @returns 検証済みレポート
 * @throws {Error} 応答が `ReportItem` の形でない場合
 */
const toReportItem = (value: unknown): ReportItem => {
  const parsed = parseReportItem(value);
  if (!parsed) throw new Error('Invalid report response');
  return parsed;
};

/**
 * レポート一覧を取得する。
 *
 * 転送量削減のため、一覧 API は本文（`content`）を含まない軽量版を返す。
 * 応答は 1 件ずつ検証し、形の合わない要素は捨てる（`parseReportList`）。
 *
 * @returns レポート一覧
 * @throws {ApiError} 非 2xx が返った場合
 */
export const fetchReports = async (): Promise<ReportItem[]> =>
  parseReportList(await requestJson<unknown>('/api/reports'));

/**
 * レポート 1 件を本文込みで取得する。
 *
 * @param id - 取得対象レポートの ID
 * @returns 本文を含むレポート
 * @throws {ApiError} 非 2xx が返った場合
 * @throws {Error} 応答が `ReportItem` の形でない場合
 */
export const fetchReport = async (id: string): Promise<ReportItem> =>
  toReportItem(await requestJson<unknown>(`/api/reports/${id}`));

/**
 * レポートを新規作成する。
 *
 * @param report - id を除いたレポート入力値
 * @param token - Bearer 認証に使うアクセストークン
 * @returns 作成されたレポート（サーバー採番の ID を含む）
 * @throws {ApiError} 非 2xx が返った場合
 * @throws {Error} 応答が `ReportItem` の形でない場合
 */
export const createReport = async (
  report: Omit<ReportItem, 'id'>,
  token: string | null,
): Promise<ReportItem> =>
  toReportItem(await requestJson<unknown>('/api/reports', { method: 'POST', body: report, token }));

/**
 * レポートを部分更新する。
 *
 * @param id - 更新対象レポートの ID
 * @param updatedData - 変更したいフィールドのみを含む部分オブジェクト
 * @param token - Bearer 認証に使うアクセストークン
 * @returns 更新後のレポート
 * @throws {ApiError} 非 2xx が返った場合
 * @throws {Error} 応答が `ReportItem` の形でない場合
 */
export const updateReport = async (
  id: string,
  updatedData: Partial<ReportItem>,
  token: string | null,
): Promise<ReportItem> =>
  toReportItem(
    await requestJson<unknown>(`/api/reports/${id}`, {
      method: 'PATCH',
      body: updatedData,
      token,
    }),
  );

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
