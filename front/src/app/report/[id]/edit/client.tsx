'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/organisms/AppShell';
import FormPage from '@/components/pages/FormPage';
import { useAppState } from '@/hooks/useAppState';
import { useReport } from '@/hooks/useReport';

export default function ReportEditClient() {
  const params = useParams();
  const { theme, reports, currentUser, updateReport, isHydrated } = useAppState();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const listReport = reports.find((item) => item.id === reportId);
  const { report } = useReport(reportId, listReport);

  if (!reportId) return null;

  // Pass the full report (with content) as a single-item array for useReportForm lookup
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
