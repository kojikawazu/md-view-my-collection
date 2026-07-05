'use client';

import React from 'react';

interface TagChipProps {
  /** チップに表示するタグ名。 */
  label: string;
  /** 追加の Tailwind クラス。 */
  className?: string;
  /** クリック時のハンドラ。指定した場合のみボタンとして描画され、押下操作が可能になる。 */
  onClick?: () => void;
  /** 選択状態。onClick 指定時に aria-pressed へ反映する。 */
  selected?: boolean;
}

/**
 * タグを表す小さなチップ部品。
 *
 * onClick の有無で振る舞いを変え、指定時は押下可能な button、未指定時は静的な span として描画する。
 */
const TagChip: React.FC<TagChipProps> = ({ label, className = '', onClick, selected }) => {
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? selected : undefined}
      onClick={onClick}
      className={`text-[10px] px-2 py-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {label}
    </Tag>
  );
};

export default TagChip;
