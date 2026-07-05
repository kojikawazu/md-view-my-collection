'use client';

import React from 'react';
import CategoryButton from '@/components/molecules/CategoryButton';
import { DesignSystem } from '@/types';
import { CATEGORIES } from '@/constants';

/** サイドバーの props。 */
interface SidebarProps {
  /** 配色・フォント・サイドバー配置スタイルなどのデザインシステム */
  theme: DesignSystem;
  /** 表示候補となるタグの生リスト（重複・先頭 `#`・空白を含みうる） */
  tags: string[];
  /** 現在選択中のカテゴリ。未選択時は `null` */
  selectedCategory: string | null;
  /** カテゴリ選択の切り替えコールバック（解除時は `null`） */
  onSelectCategory: (category: string | null) => void;
  /** 現在選択中のタグ（正規化済みの value）。未選択時は `null` */
  selectedTag: string | null;
  /** タグ選択の切り替えコールバック（解除時は `null`） */
  onSelectTag: (tag: string | null) => void;
}

/**
 * 左サイドバー。固定カテゴリ一覧とトレンドタグによる絞り込み UI を提供する。
 * 同じカテゴリ/タグを再クリックすると選択解除（`null`）としてトグルする。
 * デザインテーマの引用文パネルも表示する。中〜大画面（md 以上）でのみ表示する。
 */
const Sidebar: React.FC<SidebarProps> = ({
  theme,
  tags,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
}) => {
  const { colors, fontHeader, sidebarStyle, borderRadius } = theme;

  // 表示用ラベル: 先頭の `#` を除去し前後空白を落とす（`#` は CSS の before で付与するため）
  const normalizeTag = (tag: string) => tag.replace(/^#/, '').trim();
  // 比較・選択判定用の値: 大文字小文字を無視するため小文字化する
  const normalizeTagValue = (tag: string) => normalizeTag(tag).toLowerCase();
  // 正規化後の表示ラベルで重複排除し、ラベル（表示用）と value（判定用）の組へ整形する
  const visibleTags = Array.from(
    new Set(tags.map(normalizeTag).filter(Boolean)),
  ).map((tag) => ({
    label: tag,
    value: normalizeTagValue(tag),
  }));

  return (
    <aside
      className={`${
        sidebarStyle === 'full-height' ? 'h-full border-r' : 'py-8'
      } ${colors.border} px-6 transition-all duration-300 w-64 shrink-0 hidden md:block`}
    >
      <div className="space-y-12 sticky top-32 mt-4">
        <div>
          <h3 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-6`}>
            Categories
          </h3>
          <ul className="space-y-4 text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <CategoryButton
                  category={cat}
                  selected={selectedCategory === cat}
                  onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                  textClassName={colors.text}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-4`}>
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {visibleTags.length > 0 ? (
              visibleTags.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selectedTag === value}
                  className={`text-[10px] px-2 py-1 max-w-full truncate ${colors.accent} text-white ${borderRadius} cursor-pointer hover:brightness-125 transition-all before:mr-0.5 before:content-['#'] ${
                    selectedTag === value
                      ? 'ring-2 ring-[#2a1b12] ring-offset-2 ring-offset-[#faf7f5] scale-[1.05] brightness-110 shadow-md'
                      : 'opacity-70'
                  }`}
                  onClick={() => onSelectTag(selectedTag === value ? null : value)}
                >
                  {label}
                </button>
              ))
            ) : (
              <span className={`text-[10px] ${colors.muted}`}>No tags</span>
            )}
          </div>
        </div>

        <div className={`mt-20 pt-8 border-t ${colors.border}`}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-[#3d2b1f] opacity-40">
            {"Director's Manifesto"}
          </p>
          <div className="relative pl-4 border-l-2 border-[#5c4033]">
            <p className={`${fontHeader} text-sm italic leading-relaxed ${colors.text} opacity-90`}>
              {'"True design is the intersection of logic and emotion."'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-4 h-[1px] bg-[#3d2b1f] opacity-30"></div>
              <span className="text-[10px] font-bold tracking-widest opacity-60">H. TANAKA</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
