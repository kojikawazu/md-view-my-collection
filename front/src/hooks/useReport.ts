import { useEffect, useState } from 'react';
import { ReportItem } from '@/types';

/**
 * Fetches a single report with full content from /api/reports/[id].
 * Returns the cached report from the list (without content) immediately,
 * then replaces it with the full report once the API responds.
 */
export const useReport = (
  reportId: string | undefined,
  listReport: ReportItem | undefined,
) => {
  const [report, setReport] = useState<ReportItem | undefined>(listReport);
  const [isLoading, setIsLoading] = useState(false);

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'supabase';

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
  }, [reportId, listReport?.id, listReport?.content, dataMode]);

  return { report, isLoading };
};
