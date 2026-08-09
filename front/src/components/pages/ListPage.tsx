'use client';

import React, { useEffect } from 'react';
import AppLink from '@/components/atoms/AppLink';
import { useAppState } from '@/hooks/useAppState';
import { usePagination } from '@/hooks/usePagination';
import ReportCardMeta from '@/components/molecules/ReportCardMeta';
import AuthorInfo from '@/components/molecules/AuthorInfo';
import FilterIndicator from '@/components/molecules/FilterIndicator';
import PaginationNav from '@/components/molecules/PaginationNav';
import type { ReportItem } from '@/types/report';
import type { DesignSystem } from '@/types/theme';

interface ListPageProps {
  /** テーマ（配色・フォント・角丸などのデザイントークン一式） */
  theme: DesignSystem;
  /** 一覧表示するレポート群（サーバー側で取得済みのものを受け取る） */
  reports: ReportItem[];
}

/**
 * レポート一覧画面。サーバーから受け取ったレポートを、カテゴリ／タグの
 * 選択状態でフィルタし、ページネーションして表示する。
 * 各カードから詳細ページ（`/report/:id`）へ遷移する。
 */
const ListPage: React.FC<ListPageProps> = ({ theme, reports }) => {
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  const { selectedCategory, selectedTag, setSelectedCategory, setSelectedTag, currentUser } =
    useAppState();

  // 一覧画面に入るたびに前回のフィルタ選択を解除し、常に全件表示から始める。
  // （サイドバー等でのフィルタ状態はグローバルに持続するため、ここでリセットする）
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedTag(null);
  }, [setSelectedCategory, setSelectedTag]);

  /**
   * タグ文字列を比較用に正規化する。先頭の `#` を除去し、前後空白を落とし、
   * 小文字化することで、表記ゆれ（`#UI` / `ui` 等）を吸収して照合する。
   *
   * @param tag - 正規化対象のタグ文字列
   */
  const normalizeTagValue = (tag: string) => tag.replace(/^#/, '').trim().toLowerCase();
  const visibleReports = reports.filter((report) => {
    if (selectedCategory && report.category !== selectedCategory) return false;
    if (selectedTag) {
      const normalizedTags = (report.tags ?? []).map(normalizeTagValue);
      if (!normalizedTags.includes(selectedTag)) return false;
    }
    return true;
  });

  // フィルタ条件が変わったらページネーションを1ページ目へ戻すためのキー。
  // このキーの変化を usePagination が検知して現在ページをリセットする。
  const filterKey = `${selectedCategory ?? ''}|${selectedTag ?? ''}`;
  const { currentPage, totalPages, pageNumbers, updatePage, paginateSlice } = usePagination(
    visibleReports.length,
    filterKey,
  );
  const paginatedReports = paginateSlice(visibleReports);

  /**
   * カード表示用の日付を求める。publishDate を優先し、無ければ createdAt に
   * フォールバックする。ISO 形式（`T` 区切り）の場合は日付部分のみを取り出す。
   *
   * @param report - 日付を取り出す対象レポート
   */
  const getDisplayDate = (report: ReportItem) => {
    const raw = report.publishDate || report.createdAt || '';
    return raw.includes('T') ? raw.split('T')[0] : raw;
  };

  return (
    <div className="p-8 md:p-12 transition-all duration-300">
      <div className="mb-12 max-w-4xl">
        <h1 className={`${fontHeader} text-4xl md:text-5xl font-bold ${colors.primary} mb-4`}>
          Latest Reports
        </h1>
        <FilterIndicator
          category={selectedCategory}
          tag={selectedTag}
          onClear={() => {
            setSelectedCategory(null);
            setSelectedTag(null);
          }}
          badgeClassName={`${colors.border} ${colors.text} ${borderRadius}`}
          mutedClassName={colors.muted}
        />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {paginatedReports.map((report) => {
          // 著者名はレポート個別の値ではなく、ログイン中ユーザー名（未ログイン時は
          // 'Manager'）に統一して表示する。運用上、投稿者は単一の管理者を前提とするため。
          const displayAuthor = currentUser?.username ?? 'Manager';
          return (
            <article
              key={report.id}
              className={`${colors.surface} ${colors.border} border p-8 transition-all duration-300 shadow-sm hover:shadow-xl ${borderRadius} group`}
            >
              <ReportCardMeta
                category={report.category}
                date={getDisplayDate(report)}
                badgeClassName={`${colors.accent} text-white ${borderRadius}`}
                dateClassName={colors.muted}
              />
              <h2
                className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4 leading-tight group-hover:underline`}
              >
                <AppLink href={`/report/${report.id}`}>{report.title}</AppLink>
              </h2>
              <p
                className={`${fontPrimary} ${colors.text} opacity-80 mb-8 line-clamp-3 leading-relaxed`}
              >
                {report.summary}
              </p>
              <div className="flex items-center justify-between border-t pt-6 border-inherit">
                <AuthorInfo
                  name={displayAuthor}
                  role="Research Fellow"
                  avatarClassName={`${colors.accent} ${borderRadius} text-[#3d2b1f]`}
                  nameClassName={`text-sm ${colors.text}`}
                  subtitleClassName={colors.muted}
                />
                <AppLink
                  href={`/report/${report.id}`}
                  className={`${colors.text} text-sm font-bold border-b-2 border-transparent hover:border-current transition-all`}
                >
                  Read Report &rarr;
                </AppLink>
              </div>
            </article>
          );
        })}
        {visibleReports.length === 0 && (
          <div className={`col-span-full py-24 text-center ${colors.muted}`}>
            <p className="text-xl italic">No reports found.</p>
          </div>
        )}
      </div>

      <PaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageChange={updatePage}
        borderClassName={colors.border}
        borderRadius={borderRadius}
        surfaceClassName={colors.surface}
        textClassName={colors.text}
        accentClassName={colors.accent}
      />
    </div>
  );
};

export default ListPage;
