'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesignSystem, ReportItem, User } from '../../types';
import { CATEGORIES } from '../../constants';
import ConfirmationModal from '../ConfirmationModal';

interface FormPageProps {
  theme: DesignSystem;
  reports?: ReportItem[];
  onSubmit: (data: Omit<ReportItem, 'id'>) => void;
  user: User | null;
  reportId?: string;
  isHydrated?: boolean;
}

const FormPage: React.FC<FormPageProps> = ({
  theme,
  reports,
  onSubmit,
  user,
  reportId,
  isHydrated = true,
}) => {
  const router = useRouter();
  const { colors, fontHeader, borderRadius } = theme;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<ReportItem, 'id'>>({
    title: '',
    summary: '',
    content: '',
    category: CATEGORIES[0],
    author: user?.username || 'Guest Editor',
    publishDate: new Date().toISOString().split('T')[0],
    tags: [],
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
    }
    if (reportId && reports) {
      const existing = reports.find((report) => report.id === reportId);
      if (existing) {
        const { id: _, ...rest } = existing;
        setFormData(rest);
      }
    }
  }, [reportId, reports, user, router, isHydrated]);

  if (!isHydrated) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tags = event.target.value
      .split(',')
      .map((tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return '';
        return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      })
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
    if (tags.length > 0) setTagError(null);
  };

  const handleSubmitAttempt = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.tags.length === 0) {
      setTagError('タグを入力してください。');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 md:p-12">
      <h1 className={`${fontHeader} text-4xl font-bold ${colors.primary} mb-12`}>
        {reportId ? 'レポートを再構築' : '新しいレポートを起草'}
      </h1>

      <form onSubmit={handleSubmitAttempt} className="space-y-8">
        <div className="space-y-2">
          <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>タイトル</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={`w-full bg-white border ${colors.border} p-4 text-xl ${fontHeader} focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius}`}
            placeholder="魅力的な見出しを入力..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>カテゴリー</label>
            <select
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
          </div>
          <div className="space-y-2">
            <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>
              タグ (カンマ区切り)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none ${borderRadius}`}
              placeholder="例: デザイン, UI, 2024"
            />
            {tagError && <p className="text-xs text-red-700">{tagError}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>要約</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            required
            className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none min-h-[100px] ${borderRadius}`}
            placeholder="レポートの概要を簡潔に記述してください..."
          />
        </div>

        <div className="space-y-2">
          <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>本文 (Markdown)</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className={`w-full bg-white border ${colors.border} p-6 font-mono text-sm focus:outline-none min-h-[400px] leading-relaxed ${borderRadius}`}
            placeholder="# 見出しから始める..."
          />
        </div>

        <div className="pt-8 flex justify-end gap-4 border-t border-inherit">
          <button
            type="button"
            onClick={() => router.back()}
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
