'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/organisms/AppShell';
import DetailPage from '@/components/pages/DetailPage';
import { useAppState } from '@/hooks/useAppState';
import { useReport } from '@/hooks/useReport';

export default function ReportDetailClient() {
  const params = useParams();
  const { theme, reports, currentUser, deleteReport } = useAppState();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const listReport = reports.find((item) => item.id === reportId);
  const { report } = useReport(reportId, listReport);

  return (
    <AppShell>
      <DetailPage theme={theme} report={report} user={currentUser} onDelete={deleteReport} />
    </AppShell>
  );
}
