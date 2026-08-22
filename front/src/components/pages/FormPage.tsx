'use client';

import React from 'react';
import type { MutationResult } from '@/types/api';
import type { ReportItem } from '@/types/report';
import type { DesignSystem } from '@/types/theme';
import type { User } from '@/types/user';
import { CATEGORIES } from '@/types/report';
import { useReportForm } from '@/hooks/useReportForm';
import FormField from '@/components/molecules/FormField';
import ExternalUrlFieldList from '@/components/molecules/ExternalUrlFieldList';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';

interface FormPageProps {
  /** テーマ（配色・フォント・角丸などのデザイントークン一式） */
  theme: DesignSystem;
  /** 既存レポート群。編集時に reportId から初期値を引き当てるために使う */
  reports?: ReportItem[];
  /** 送信ハンドラ（新規作成／更新）。成否を MutationResult で返す */
  onSubmit: (data: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
  /** ログイン中ユーザー。フォームのロジック（権限・著者情報）に利用する */
  user: User | null;
  /** 編集対象のレポートID。未指定なら新規投稿モードとして扱う */
  reportId?: string;
  /** ハイドレーション完了フラグ。未完了時は描画を抑止してSSR不一致を避ける */
  isHydrated?: boolean;
}

/**
 * レポートの新規投稿・編集フォーム画面。reportId の有無で新規／編集モードを
 * 切り替える。入力・バリデーション・外部URLの増減・送信確認モーダルといった
 * フォームロジックは useReportForm フックに委譲し、本コンポーネントは描画に専念する。
 */
const FormPage: React.FC<FormPageProps> = ({
  theme,
  reports,
  onSubmit,
  user,
  reportId,
  isHydrated = true,
}) => {
  const { colors, fontHeader, borderRadius } = theme;
  const {
    formData,
    tagError,
    serverError,
    fieldErrors,
    showConfirmModal,
    setShowConfirmModal,
    handleChange,
    handleTagsChange,
    handleSubmitAttempt,
    handleConfirmSubmit,
    externalUrls,
    addExternalUrl,
    removeExternalUrl,
    updateExternalUrl,
    goBack,
  } = useReportForm({ user, reportId, reports, onSubmit, isHydrated });

  // ハイドレーション未完了の間は描画しない（クライアント専用の初期値でSSRとの
  // マークアップ不一致が起きるのを避けるため）。
  if (!isHydrated) return null;

  const fieldLabelClass = colors.muted;

  return (
    <div className="max-w-3xl mx-auto p-8 md:p-12">
      <h1 className={`${fontHeader} text-4xl font-bold ${colors.primary} mb-12`}>
        {reportId ? 'レポートを編集' : '新しいレポートを投稿'}
      </h1>

      {serverError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmitAttempt} className="space-y-8">
        <FormField label="タイトル" labelClassName={fieldLabelClass} error={fieldErrors.title}>
          {(id) => (
            <input
              id={id}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={`w-full bg-white border ${colors.border} p-4 text-xl ${fontHeader} focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius}`}
              placeholder="魅力的な見出しを入力..."
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            label="カテゴリー"
            labelClassName={fieldLabelClass}
            error={fieldErrors.category}
          >
            {(id) => (
              <select
                id={id}
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none ${borderRadius}`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField
            label="タグ (カンマ区切り)"
            labelClassName={fieldLabelClass}
            error={tagError || fieldErrors.tags}
          >
            {(id) => (
              <input
                id={id}
                type="text"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none ${borderRadius}`}
                placeholder="例: デザイン, UI, 2024"
              />
            )}
          </FormField>
        </div>

        <FormField label="要約" labelClassName={fieldLabelClass} error={fieldErrors.summary}>
          {(id) => (
            <textarea
              id={id}
              name="summary"
              value={formData.summary ?? ''}
              onChange={handleChange}
              required
              className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none min-h-[100px] ${borderRadius}`}
              placeholder="レポートの概要を簡潔に記述してください..."
            />
          )}
        </FormField>

        <FormField
          label="本文 (Markdown)"
          labelClassName={fieldLabelClass}
          error={fieldErrors.content}
        >
          {(id) => (
            <textarea
              id={id}
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              className={`w-full bg-white border ${colors.border} p-6 font-mono text-sm focus:outline-none min-h-[400px] leading-relaxed ${borderRadius}`}
              placeholder="# 見出しから始める..."
            />
          )}
        </FormField>

        <ExternalUrlFieldList
          urls={externalUrls}
          fieldErrors={fieldErrors}
          onAdd={addExternalUrl}
          onRemove={removeExternalUrl}
          onChangeUrl={(i, v) => updateExternalUrl(i, 'url', v)}
          onChangeLabel={(i, v) => updateExternalUrl(i, 'label', v)}
          labelClassName={fieldLabelClass}
          borderClass={colors.border}
          borderRadiusClass={borderRadius}
        />

        <div className="pt-8 flex justify-end gap-4 border-t border-inherit">
          <button
            type="button"
            onClick={goBack}
            className={`px-8 py-3 text-sm font-bold ${colors.muted} hover:text-black transition-colors`}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className={`px-12 py-3 ${colors.accent} text-white font-bold text-sm hover:brightness-125 transition-all ${borderRadius}`}
          >
            {reportId ? '変更を保存' : 'レポートを投稿'}
          </button>
        </div>
      </form>

      <ConfirmationModal
        theme={theme}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title={reportId ? '変更の保存確認' : 'レポートの投稿確認'}
        message={
          reportId
            ? '入力した内容でレポートを更新します。よろしいですか？'
            : '作成した内容でレポートを公開します。よろしいですか？'
        }
        confirmLabel={reportId ? '保存する' : '投稿する'}
      />
    </div>
  );
};

export default FormPage;
