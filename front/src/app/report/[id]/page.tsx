'use client';

import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import DetailPage from '../../../components/pages/DetailPage';
import { useAppState } from '../../../components/AppStateProvider';

export default function ReportDetailPage() {
  const params = useParams();
  const { theme, reports, currentUser, deleteReport } = useAppState();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const report = reports.find((item) => item.id === reportId);

  return (
    <AppShell>
      <DetailPage theme={theme} report={report} user={currentUser} onDelete={deleteReport} />
    </AppShell>
  );
}
