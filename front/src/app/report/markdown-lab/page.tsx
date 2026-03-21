'use client';

import AppShell from '@/components/organisms/AppShell';
import { useAppState } from '@/hooks/useAppState';
import MarkdownLabPage from '@/components/pages/MarkdownLabPage';

export default function ReportMarkdownLabRoute() {
  const { theme } = useAppState();

  return (
    <AppShell>
      <MarkdownLabPage theme={theme} />
    </AppShell>
  );
}
