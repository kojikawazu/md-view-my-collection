'use client';

import AppShell from '@/components/organisms/AppShell';
import ListPage from '@/components/pages/ListPage';
import { useAppState } from '@/hooks/useAppState';

export default function HomePage() {
  const { theme, reports } = useAppState();

  return (
    <AppShell>
      <ListPage theme={theme} reports={reports} />
    </AppShell>
  );
}
