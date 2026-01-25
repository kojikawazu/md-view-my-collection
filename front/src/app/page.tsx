'use client';

import AppShell from '../components/AppShell';
import ListPage from '../components/pages/ListPage';
import { useAppState } from '../components/AppStateProvider';

export default function HomePage() {
  const { theme, reports, isHydrated } = useAppState();

  if (!isHydrated) {
    return null;
  }

  return (
    <AppShell>
      <ListPage theme={theme} reports={reports} />
    </AppShell>
  );
}
