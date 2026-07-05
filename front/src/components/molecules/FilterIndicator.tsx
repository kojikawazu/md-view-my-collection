'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface FilterIndicatorProps {
  /** 選択中のカテゴリ。null なら未選択でバッジを出さない。 */
  category: string | null;
  /** 選択中のタグ。null なら未選択でバッジを出さない。 */
  tag: string | null;
  /** 「Clear」押下時に呼ぶ。フィルタ解除を親に委ねる。 */
  onClear: () => void;
  /** バッジへ付与する追加クラス。 */
  badgeClassName?: string;
  /** 補助テキスト（Filter ラベル/Clear ボタン）へ付与する追加クラス。 */
  mutedClassName?: string;
}

/** 適用中のカテゴリ/タグフィルタをバッジ表示し、解除ボタンを出す。どちらも未選択なら描画しない。 */

const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  category,
  tag,
  onClear,
  badgeClassName = '',
  mutedClassName = '',
}) => {
  // カテゴリ・タグとも未選択ならフィルタ表示自体を出さない。
  if (!category && !tag) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
      <span className={mutedClassName}>Filter</span>
      {category && (
        <span className={`px-2 py-1 border ${badgeClassName}`}>{category}</span>
      )}
      {tag && (
        <span className={`px-2 py-1 border ${badgeClassName}`}>#{tag}</span>
      )}
      <Button
        type="button"
        onClick={onClear}
        className={`text-[10px] ${mutedClassName} border-b border-transparent hover:border-current`}
      >
        Clear
      </Button>
    </div>
  );
};

export default FilterIndicator;
