'use client';

import AppShell from '@/components/organisms/AppShell';
import ListPage from '@/components/pages/ListPage';
import { useAppState } from '@/hooks/useAppState';

/**
 * トップ画面（`/`・クライアントコンポーネント）。
 * `useAppState` からテーマとレポート一覧を取得し、`AppShell` 内の `ListPage` へ渡して一覧を表示する。
 */
export default function HomePage() {
  const { theme, reports } = useAppState();

  return (
    <AppShell>
      <ListPage theme={theme} reports={reports} />
    </AppShell>
  );
}
