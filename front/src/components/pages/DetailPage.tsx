'use client';

import React, { useState } from 'react';
import AppLink from '../AppLink';
import { DesignSystem, ReportItem, User } from '../../types';
import ConfirmationModal from '../ConfirmationModal';
import ReportMarkdown from '../ReportMarkdown';

interface DetailPageProps {
  theme: DesignSystem;
  report?: ReportItem;
  user: User | null;
  onDelete: (id: string) => void;
}

const DetailPage: React.FC<DetailPageProps> = ({ theme, report, user, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  const displayDate = report
    ? (report.publishDate || report.createdAt || '').split('T')[0]
    : '';
  const displayAuthor = user?.username ?? 'Manager';

  if (!report) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <AppLink href="/" className="underline">
          Go back to list
        </AppLink>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto p-8 md:p-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <AppLink href="/" className={`text-sm ${colors.muted} hover:opacity-70 transition-opacity`}>
            &larr; All Reports
          </AppLink>
          <span className="opacity-20">|</span>
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${colors.accent} text-white ${borderRadius}`}
          >
            {report.category}
          </span>
        </div>

        <h1 className={`${fontHeader} text-4xl md:text-6xl font-black ${colors.primary} mb-8 leading-tight`}>
          {report.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-inherit">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 ${colors.accent} ${borderRadius} opacity-20 flex items-center justify-center font-bold text-xl`}
            >
              {displayAuthor.charAt(0)}
            </div>
            <div>
              <p className={`font-bold ${colors.text}`}>{displayAuthor}</p>
              <p className={`text-xs ${colors.muted}`}>{displayDate}</p>
            </div>
          </div>

          {user && (
            <div className="flex gap-4">
              <AppLink
                href={`/report/${report.id}/edit`}
                className={`px-4 py-2 border ${colors.border} text-sm font-bold hover:bg-black hover:text-white transition-all`}
              >
                編集
              </AppLink>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-800 text-white text-sm font-bold hover:bg-red-950 transition-all"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      <ReportMarkdown content={report.content} className={fontPrimary} />

      <div className="mt-16 pt-12 border-t border-inherit">
        <h4 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-4`}>Tags</h4>
        <div className="flex gap-2">
          {report.tags.map((tag) => (
            <span key={tag} className={`text-[10px] px-3 py-1 bg-neutral-200 ${colors.text} ${borderRadius}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ConfirmationModal
        theme={theme}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => onDelete(report.id)}
        title="レポートの削除"
        message="このレポートを完全に削除してもよろしいですか？この操作は取り消せません。"
        confirmLabel="削除する"
        confirmVariant="danger"
      />
    </article>
  );
};

export default DetailPage;
