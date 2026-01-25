'use client';

import React, { useEffect } from 'react';
import AppLink from '../AppLink';
import { useAppState } from '../AppStateProvider';
import { DesignSystem, ReportItem } from '../../types';

interface ListPageProps {
  theme: DesignSystem;
  reports: ReportItem[];
}

const ListPage: React.FC<ListPageProps> = ({ theme, reports }) => {
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  const { selectedCategory, selectedTag, setSelectedCategory, setSelectedTag } = useAppState();
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
        {visibleReports.map((report) => (
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
                  {report.author.charAt(0)}
                </div>
                <div>
                  <span className={`block text-sm font-bold ${colors.text}`}>{report.author}</span>
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
        ))}
        {visibleReports.length === 0 && (
          <div className={`col-span-full py-24 text-center ${colors.muted}`}>
            <p className="text-xl italic">No reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPage;
