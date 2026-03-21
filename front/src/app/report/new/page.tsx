'use client';

import AppShell from '../../../components/AppShell';
import FormPage from '../../../components/pages/FormPage';
import { useAppState } from '@/hooks/useAppState';

export default function ReportNewPage() {
  const { theme, currentUser, addReport, isHydrated } = useAppState();

  return (
    <AppShell>
      <FormPage theme={theme} onSubmit={addReport} user={currentUser} isHydrated={isHydrated} />
    </AppShell>
  );
}
