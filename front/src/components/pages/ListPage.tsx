'use client';

import React, { useEffect, useState } from 'react';
import AppLink from '../AppLink';
import { useAppState } from '../AppStateProvider';
import { DesignSystem, ReportItem } from '../../types';

interface ListPageProps {
  theme: DesignSystem;
  reports: ReportItem[];
}

const ITEMS_PER_PAGE = 10;
const MAX_PAGE_BUTTONS = 5;

const ListPage: React.FC<ListPageProps> = ({ theme, reports }) => {
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  const { selectedCategory, selectedTag, setSelectedCategory, setSelectedTag, currentUser } = useAppState();
  const filterKey = `${selectedCategory ?? ''}|${selectedTag ?? ''}`;
  const [paginationState, setPaginationState] = useState(() => ({
    page: 1,
    filterKey,
  }));
  const getDisplayDate = (report: ReportItem) => {
    const raw = report.publishDate || report.createdAt || '';
    return raw.includes('T') ? raw.split('T')[0] : raw;
  };

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
  const totalPages = Math.ceil(visibleReports.length / ITEMS_PER_PAGE);
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage =
    paginationState.filterKey === filterKey ? Math.min(paginationState.page, safeTotalPages) : 1;
  const paginatedReports = visibleReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pageStart = Math.max(
    1,
    Math.min(currentPage - Math.floor(MAX_PAGE_BUTTONS / 2), safeTotalPages - MAX_PAGE_BUTTONS + 1),
  );
  const pageEnd = Math.min(safeTotalPages, pageStart + MAX_PAGE_BUTTONS - 1);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);
  const updatePage = (nextPage: number) => {
    setPaginationState({
      page: Math.min(Math.max(nextPage, 1), safeTotalPages),
      filterKey,
    });
  };

  return (
    <div className="p-8 md:p-12 transition-all duration-300">
      <div className="mb-12 max-w-4xl">
        <h1 className={`${fontHeader} text-4xl md:text-5xl font-bold ${colors.primary} mb-4`}>
          Latest Reports
        </h1>
        {(selectedCategory || selectedTag) && (
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
            <span className={`${colors.muted}`}>Filter</span>
            {selectedCategory && (
              <span className={`px-2 py-1 border ${colors.border} ${colors.text} ${borderRadius}`}>
                {selectedCategory}
              </span>
            )}
            {selectedTag && (
              <span className={`px-2 py-1 border ${colors.border} ${colors.text} ${borderRadius}`}>
                #{selectedTag}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedTag(null);
              }}
              className={`text-[10px] ${colors.muted} hover:${colors.text} border-b border-transparent hover:border-current transition-all`}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {paginatedReports.map((report) => {
          const displayAuthor = currentUser?.username ?? 'Manager';
          return (
            <article
              key={report.id}
              className={`${colors.surface} ${colors.border} border p-8 transition-all duration-300 shadow-sm hover:shadow-xl ${borderRadius} group`}
            >
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 ${colors.accent} text-white ${borderRadius}`}
                >
                  {report.category}
                </span>
                <span className={`text-xs ${colors.muted}`}>{getDisplayDate(report)}</span>
              </div>
              <h2 className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4 leading-tight group-hover:underline`}>
                <AppLink href={`/report/${report.id}`}>{report.title}</AppLink>
              </h2>
              <p className={`${fontPrimary} ${colors.text} opacity-80 mb-8 line-clamp-3 leading-relaxed`}>
                {report.summary}
              </p>
              <div className="flex items-center justify-between border-t pt-6 border-inherit">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${colors.accent} ${borderRadius} opacity-20 flex items-center justify-center font-bold text-[#3d2b1f]`}
                  >
                    {displayAuthor.charAt(0)}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${colors.text}`}>{displayAuthor}</span>
                    <span className={`block text-[10px] tracking-wider uppercase ${colors.muted} font-medium`}>
                      Research Fellow
                    </span>
                  </div>
                </div>
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

      {safeTotalPages > 1 && (
        <nav aria-label="ページネーション" className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => updatePage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`min-w-[4.5rem] px-3 py-2 text-sm border ${colors.border} ${borderRadius} transition-all ${
              currentPage === 1 ? 'opacity-40 cursor-not-allowed' : `${colors.surface} ${colors.text}`
            }`}
          >
            前へ
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => updatePage(pageNumber)}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              className={`w-10 h-10 text-sm border ${borderRadius} transition-all ${
                pageNumber === currentPage
                  ? `${colors.accent} text-white border-transparent`
                  : `${colors.surface} ${colors.text} ${colors.border}`
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => updatePage(currentPage + 1)}
            disabled={currentPage === safeTotalPages}
            className={`min-w-[4.5rem] px-3 py-2 text-sm border ${colors.border} ${borderRadius} transition-all ${
              currentPage === safeTotalPages ? 'opacity-40 cursor-not-allowed' : `${colors.surface} ${colors.text}`
            }`}
          >
            次へ
          </button>
        </nav>
      )}
    </div>
  );
};

export default ListPage;
