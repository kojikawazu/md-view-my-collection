'use client';

import AppShell from '@/components/organisms/AppShell';
import FormPage from '@/components/pages/FormPage';
import { useAppState } from '@/hooks/useAppState';

/**
 * レポート新規作成画面（`/report/new`・クライアントコンポーネント）。
 * `useAppState` からテーマ・ログインユーザー・新規追加ハンドラ（`addReport`）を取得し、空の `FormPage` を表示する。
 */
export default function ReportNewPage() {
  const { theme, currentUser, addReport, isHydrated } = useAppState();

  return (
    <AppShell>
      <FormPage theme={theme} onSubmit={addReport} user={currentUser} isHydrated={isHydrated} />
    </AppShell>
  );
}
