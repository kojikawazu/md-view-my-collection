
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DesignSystem, ReportItem, User } from '../types';
import { CATEGORIES } from '../constants';
import ConfirmationModal from '../components/ConfirmationModal';

interface FormPageProps {
  theme: DesignSystem;
  reports?: ReportItem[];
  onSubmit: (data: Omit<ReportItem, 'id'>) => void;
  user: User | null;
}

const FormPage: React.FC<FormPageProps> = ({ theme, reports, onSubmit, user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors, fontHeader, borderRadius } = theme;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState<Omit<ReportItem, 'id'>>({
    title: '',
    summary: '',
    content: '',
    category: CATEGORIES[0],
    author: user?.username || 'Guest Editor',
    date: new Date().toISOString().split('T')[0],
    tags: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (id && reports) {
      const existing = reports.find(r => r.id === id);
      if (existing) {
        const { id: _, ...rest } = existing;
        setFormData(rest);
      }
    }
  }, [id, reports, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => {
      const trimmed = t.trim();
      if (!trimmed) return '';
      return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    }).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 md:p-12">
      <h1 className={`${fontHeader} text-4xl font-bold ${colors.primary} mb-12`}>
        {id ? 'レポートを再構築' : '新しいレポートを起草'}
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
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={`text-xs uppercase tracking-widest ${colors.muted} font-bold`}>タグ (カンマ区切り)</label>
            <input 
              type="text" 
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className={`w-full bg-white border ${colors.border} p-4 text-sm focus:outline-none ${borderRadius}`}
              placeholder="例: デザイン, UI, 2024"
            />
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
            onClick={() => navigate(-1)}
            className={`px-8 py-3 text-sm font-bold ${colors.muted} hover:text-black transition-colors`}
          >
            キャンセル
          </button>
          <button 
            type="submit" 
            className={`px-12 py-3 ${colors.accent} text-white font-bold text-sm hover:brightness-125 transition-all ${borderRadius}`}
          >
            {id ? '変更を保存' : 'レポートを投稿'}
          </button>
        </div>
      </form>

      <ConfirmationModal 
        theme={theme}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title={id ? "変更の保存確認" : "レポートの投稿確認"}
        message={id ? "入力した内容でレポートを更新します。よろしいですか？" : "作成した内容でレポートを公開します。よろしいですか？"}
        confirmLabel={id ? "保存する" : "投稿する"}
      />
    </div>
  );
};

export default FormPage;
