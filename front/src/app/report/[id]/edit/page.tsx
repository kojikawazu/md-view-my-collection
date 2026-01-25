'use client';

import { useParams } from 'next/navigation';
import AppShell from '../../../../components/AppShell';
import FormPage from '../../../../components/pages/FormPage';
import { useAppState } from '../../../../components/AppStateProvider';

export default function ReportEditPage() {
  const params = useParams();
  const { theme, reports, currentUser, updateReport, isHydrated } = useAppState();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!reportId) return null;

  return (
    <AppShell>
      <FormPage
        theme={theme}
        reports={reports}
        onSubmit={(data) => updateReport(reportId, data)}
        user={currentUser}
        reportId={reportId}
        isHydrated={isHydrated}
      />
    </AppShell>
  );
}
