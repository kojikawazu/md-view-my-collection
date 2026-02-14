'use client';

import AppShell from '../../../components/AppShell';
import { useAppState } from '../../../components/AppStateProvider';
import MarkdownLabPage from '../../../components/pages/MarkdownLabPage';

export default function ReportMarkdownLabRoute() {
  const { theme } = useAppState();

  return (
    <AppShell>
      <MarkdownLabPage theme={theme} />
    </AppShell>
  );
}
