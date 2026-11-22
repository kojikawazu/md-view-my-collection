import { useEffect, useState } from 'react';
import { fetchReport } from '@/repositories/report';
import type { ReportItem } from '@/types/report';

/** レポート詳細の取得結果。 */
type UseReportResult = {
  /** 表示対象のレポート。未取得・取得失敗時は `undefined`（「該当なし」ではない） */
  report: ReportItem | undefined;
  /** 現在の `reportId` の全文を取得中のみ true。一覧キャッシュに本文がある場合や local モードでは false のまま */
  isLoading: boolean;
};

/**
 * API から取得した全文と、その取得対象の ID の組。
 *
 * ID を一緒に持つのは、`reportId` が切り替わった後に古い ID の応答を表示しないため。
 * 取得に失敗した場合も `report: undefined` で記録し、「取得済み（失敗）」と「未取得」を区別する。
 */
type FetchedReport = {
  /** 取得対象だったレポートの ID */
  id: string;
  /** 取得した全文。取得に失敗した場合は `undefined` */
  report: ReportItem | undefined;
};

/**
 * 単一レポートを本文込みで `/api/reports/[id]` から取得するフック。
 *
 * 一覧由来の本文なしキャッシュ（`listReport`）を即座に表示し、API 応答後に全文へ差し替える
 * ことで、詳細画面の初期表示を待たせない。local モードや既に本文を持つ場合は fetch を省く。
 *
 * 表示するレポートは state に写さず、描画のたびに `listReport` と取得結果から導出する。
 * props を effect で state に同期すると、描画が 1 回余分に走るうえ、`listReport` の更新が
 * effect の依存に含まれない限り反映されない（react-hooks/set-state-in-effect / Issue #244）。
 *
 * @param reportId - 取得対象レポートの ID（未定義なら fetch しない）
 * @param listReport - 一覧から渡る本文なしのキャッシュ。即時表示と、取得失敗時の表示に使う
 * @returns レポートと取得中フラグ
 */
export const useReport = (
  reportId: string | undefined,
  listReport: ReportItem | undefined,
): UseReportResult => {
  const [fetched, setFetched] = useState<FetchedReport | undefined>(undefined);

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'supabase';

  // local モードは一覧が既に本文を持つ。作成/編集直後の楽観更新などで本文を持っている場合も
  // 取得は不要。どちらでもなければ全文を取得する。
  const needsFetch = Boolean(reportId) && dataMode !== 'local' && !listReport?.content;

  useEffect(() => {
    if (!reportId || !needsFetch) return;

    // reportId の切り替えやアンマウント後に、古い応答で state を書き換えない。
    let ignore = false;
    fetchReport(reportId)
      .then((data) => {
        if (!ignore) setFetched({ id: reportId, report: data });
      })
      // 取得失敗時は一覧由来のキャッシュ表示を維持する（画面を空にしない）。
      .catch(() => {
        if (!ignore) setFetched({ id: reportId, report: undefined });
      });
    return () => {
      ignore = true;
    };
  }, [reportId, needsFetch]);

  const fetchedForCurrent = fetched !== undefined && fetched.id === reportId ? fetched : undefined;
  const report = needsFetch ? (fetchedForCurrent?.report ?? listReport) : listReport;
  const isLoading = needsFetch && fetchedForCurrent === undefined;

  return { report, isLoading };
};
