'use client';

import AppShell from '@/components/organisms/AppShell';
import { useAppState } from '@/hooks/useAppState';
import MarkdownLabPage from '@/components/pages/MarkdownLabPage';

/**
 * Markdown スタイル検証ラボ画面（`/report/markdown-lab`・クライアントコンポーネント）。
 * Markdown 表示のスタイルを確認するための検証用ページ。認証は親レイアウトで必須化されている。
 * `useAppState` からテーマを取得し `MarkdownLabPage` へ渡す。
 */
export default function ReportMarkdownLabRoute() {
  const { theme } = useAppState();

  return (
    <AppShell>
      <MarkdownLabPage theme={theme} />
    </AppShell>
  );
}
