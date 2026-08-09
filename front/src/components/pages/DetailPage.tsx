'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLink from '@/components/atoms/AppLink';
import AuthorInfo from '@/components/molecules/AuthorInfo';
import type { MutationResult } from '@/types/api';
import type { ReportItem } from '@/types/report';
import type { DesignSystem } from '@/types/theme';
import type { User } from '@/types/user';
import ExternalUrlLinks from '@/components/molecules/ExternalUrlLinks';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';
import ReportMarkdown from '@/components/organisms/ReportMarkdown';

interface DetailPageProps {
  /** テーマ（配色・フォント・角丸などのデザイントークン一式） */
  theme: DesignSystem;
  /** 表示対象のレポート。未取得／存在しない場合は undefined */
  report?: ReportItem;
  /** ログイン中ユーザー。null の場合は未ログイン（編集・削除ボタンを出さない） */
  user: User | null;
  /** 削除実行ハンドラ。成否を MutationResult で返す（呼び出し側が API を担う） */
  onDelete: (id: string) => Promise<MutationResult>;
}

/**
 * レポート詳細画面。本文（Markdown）・外部URL・タグを表示する。
 * ログイン済みユーザーにのみ編集・削除の導線を出す認証ガードを持ち、
 * 削除確認モーダルからの削除実行と結果ハンドリングを担う。
 */
const DetailPage: React.FC<DetailPageProps> = ({ theme, report, user, onDelete }) => {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { colors, fontHeader, fontPrimary, borderRadius } = theme;
  // publishDate を優先し、無ければ createdAt を使い、ISO の日付部分のみ表示する。
  const displayDate = report ? (report.publishDate || report.createdAt || '').split('T')[0] : '';
  // 著者名はログイン中ユーザー名に統一（未ログイン時は 'Manager'）。単一管理者運用のため。
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
          <AppLink
            href="/"
            className={`text-sm ${colors.muted} hover:opacity-70 transition-opacity`}
          >
            &larr; All Reports
          </AppLink>
          <span className="opacity-20">|</span>
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${colors.accent} text-white ${borderRadius}`}
          >
            {report.category}
          </span>
        </div>

        <h1
          className={`${fontHeader} text-4xl md:text-6xl font-black ${colors.primary} mb-8 leading-tight`}
        >
          {report.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-inherit">
          <AuthorInfo
            name={displayAuthor}
            subtitle={displayDate}
            avatarSize="md"
            avatarClassName={`${colors.accent} ${borderRadius} text-xl`}
            nameClassName={colors.text}
            subtitleClassName={`text-xs ${colors.muted}`}
          />

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

      {deleteError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          {deleteError}
        </div>
      )}

      {report.content ? (
        <ReportMarkdown content={report.content} className={fontPrimary} />
      ) : (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-30" />
        </div>
      )}

      {(report.externalUrls ?? []).length > 0 && (
        <div className="mt-16 pt-12 border-t border-inherit">
          <ExternalUrlLinks
            urls={report.externalUrls}
            labelClassName={`${fontHeader} ${colors.muted}`}
            linkClassName={colors.text}
          />
        </div>
      )}

      <div className="mt-16 pt-12 border-t border-inherit">
        <h4 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-4`}>
          Tags
        </h4>
        <div className="flex gap-2">
          {report.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] px-3 py-1 bg-neutral-200 ${colors.text} ${borderRadius}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ConfirmationModal
        theme={theme}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setDeleteError(null);
          const result = await onDelete(report.id);
          if (!result.ok) {
            // 認証切れ・権限不足はログイン画面へ誘導。それ以外はその場でエラー表示する。
            if (result.status === 401 || result.status === 403) {
              router.push('/login');
            } else {
              setDeleteError(result.error);
            }
          }
        }}
        title="レポートの削除"
        message="このレポートを完全に削除してもよろしいですか？この操作は取り消せません。"
        confirmLabel="削除する"
        confirmVariant="danger"
      />
    </article>
  );
};

export default DetailPage;
