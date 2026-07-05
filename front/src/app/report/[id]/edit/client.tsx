'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/organisms/AppShell';
import FormPage from '@/components/pages/FormPage';
import { useAppState } from '@/hooks/useAppState';
import { useReport } from '@/hooks/useReport';

/**
 * レポート編集のクライアントコンポーネント。
 * URL の ID から対象レポートを取得し、更新ハンドラ（`updateReport`）とともに `FormPage` へ渡す。
 */
export default function ReportEditClient() {
  const params = useParams();
  const { theme, reports, currentUser, updateReport, isHydrated } = useAppState();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const listReport = reports.find((item) => item.id === reportId);
  const { report } = useReport(reportId, listReport);

  if (!reportId) return null;

  // 本文を含む完全なレポートを単一要素の配列で渡し、useReportForm 側の ID 検索に合わせる
  const reportsForForm = report ? [report] : [];

  return (
    <AppShell>
      <FormPage
        theme={theme}
        reports={reportsForForm}
        onSubmit={(data) => updateReport(reportId, data)}
        user={currentUser}
        reportId={reportId}
        isHydrated={isHydrated}
      />
    </AppShell>
  );
}
