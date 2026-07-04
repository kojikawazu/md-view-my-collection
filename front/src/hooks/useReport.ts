import { useEffect, useState } from 'react';
import { ReportItem } from '@/types';

/**
 * Fetches a single report with full content from /api/reports/[id].
 * Returns the cached report from the list (without content) immediately,
 * then replaces it with the full report once the API responds.
 *
 * @param reportId - 取得対象レポートの ID（未定義なら fetch しない）
 * @param listReport - 一覧から渡る本文なしのキャッシュ。即時表示の初期値に使う
 * @returns 現在のレポート（`report`）と取得中フラグ（`isLoading`）
 */
export const useReport = (
  reportId: string | undefined,
  listReport: ReportItem | undefined,
) => {
  const [report, setReport] = useState<ReportItem | undefined>(listReport);
  const [isLoading, setIsLoading] = useState(false);

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'supabase';

  // データ取得 effect。listReport を即時反映してから全文を fetch する。
  // 即時反映の同期 setState は意図的（props→state の初期同期）。
  // 依存は listReport の id/content のみ（参照変化での無駄な再取得を避けるため意図的に限定）。
  useEffect(() => {
    if (!reportId) return;

    // In local mode, the list already has full content
    if (dataMode === 'local') {
      setReport(listReport);
      return;
    }

    // If list report already has content (optimistic update after create/edit),
    // use it directly without fetching
    if (listReport?.content) {
      setReport(listReport);
      return;
    }

    // Show list metadata immediately while fetching full content
    if (listReport) {
      setReport(listReport);
    }

    setIsLoading(true);
    fetch(`/api/reports/${reportId}`)
      .then((res) => {
        if (!res.ok) return undefined;
        return res.json();
      })
      .then((data: ReportItem | undefined) => {
        if (data) setReport(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, listReport?.id, listReport?.content, dataMode]);

  return { report, isLoading };
};
