'use client';

import React, { useEffect } from 'react';
import AppLink from '@/components/atoms/AppLink';
import { useAppState } from '@/hooks/useAppState';
import { usePagination } from '@/hooks/usePagination';
import ReportCardMeta from '@/components/molecules/ReportCardMeta';
import AuthorInfo from '@/components/molecules/AuthorInfo';
import FilterIndicator from '@/components/molecules/FilterIndicator';
import PaginationNav from '@/components/molecules/PaginationNav';
import { DesignSystem, ReportItem } from '@/types';

interface ListPageProps {
  theme: DesignSystem;
  reports: ReportItem[];
}

const ListPage: React.FC<ListPageProps> = ({ theme, reports }) => {
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  const { selectedCategory, selectedTag, setSelectedCategory, setSelectedTag, currentUser } = useAppState();

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedTag(null);
  }, [setSelectedCategory, setSelectedTag]);

  const normalizeTagValue = (tag: string) => tag.replace(/^#/, '').trim().toLowerCase();
  const visibleReports = reports.filter((report) => {
    if (selectedCategory && report.category !== selectedCategory) return false;
    if (selectedTag) {
      const normalizedTags = (report.tags ?? []).map(normalizeTagValue);
      if (!normalizedTags.includes(selectedTag)) return false;
    }
    return true;
  });

  const filterKey = `${selectedCategory ?? ''}|${selectedTag ?? ''}`;
  const { currentPage, totalPages, pageNumbers, updatePage, paginateSlice } =
    usePagination(visibleReports.length, filterKey);
  const paginatedReports = paginateSlice(visibleReports);

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
              <h2 className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4 leading-tight group-hover:underline`}>
                <AppLink href={`/report/${report.id}`}>{report.title}</AppLink>
              </h2>
              <p className={`${fontPrimary} ${colors.text} opacity-80 mb-8 line-clamp-3 leading-relaxed`}>
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
