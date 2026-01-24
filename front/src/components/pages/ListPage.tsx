'use client';

import React from 'react';
import Link from 'next/link';
import { DesignSystem, ReportItem } from '../../types';

interface ListPageProps {
  theme: DesignSystem;
  reports: ReportItem[];
}

const ListPage: React.FC<ListPageProps> = ({ theme, reports }) => {
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;

  return (
    <div className="p-8 md:p-12 transition-all duration-300">
      <div className="mb-12 max-w-4xl">
        <h1 className={`${fontHeader} text-4xl md:text-5xl font-bold ${colors.primary} mb-4`}>
          Latest Reports
        </h1>
        <p className={`${fontPrimary} text-lg ${colors.muted}`}>
          Insightful analysis on digital aesthetics, functionality, and the future of design systems.
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {reports.map((report) => (
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
              <span className={`text-xs ${colors.muted}`}>{report.date}</span>
            </div>
            <h2 className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4 leading-tight group-hover:underline`}>
              <Link href={`/report/${report.id}`}>{report.title}</Link>
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
              <Link
                href={`/report/${report.id}`}
                className={`${colors.text} text-sm font-bold border-b-2 border-transparent hover:border-current transition-all`}
              >
                Read Report &rarr;
              </Link>
            </div>
          </article>
        ))}
        {reports.length === 0 && (
          <div className={`col-span-full py-24 text-center ${colors.muted}`}>
            <p className="text-xl italic">No reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPage;
