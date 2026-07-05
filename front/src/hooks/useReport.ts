import { useEffect, useState } from 'react';
import { ReportItem } from '@/types';

/**
 * 単一レポートを本文込みで `/api/reports/[id]` から取得するフック。
 *
 * 一覧由来の本文なしキャッシュ（`listReport`）を即座に表示し、API 応答後に全文へ差し替える
 * ことで、詳細画面の初期表示を待たせない。local モードや既に本文を持つ場合は fetch を省く。
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

    // local モードは一覧が既に本文を持つため、そのまま使う。
    if (dataMode === 'local') {
      setReport(listReport);
      return;
    }

    // 作成/編集直後の楽観更新などで本文を既に持っていれば、fetch せずそのまま使う。
    if (listReport?.content) {
      setReport(listReport);
      return;
    }

    // 全文取得の間、一覧のメタ情報を先に表示しておく。
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
