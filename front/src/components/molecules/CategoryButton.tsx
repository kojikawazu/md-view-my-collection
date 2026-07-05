'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface CategoryButtonProps {
  /** 表示するカテゴリ名。 */
  category: string;
  /** 選択中かどうか。true で太字＋下線を付け、`aria-pressed` にも反映する。 */
  selected: boolean;
  /** ボタン押下時に呼ぶ。 */
  onClick: () => void;
  /** 文字色などの追加クラス。 */
  textClassName?: string;
}

/** カテゴリ絞り込み用のトグルボタン。選択状態を太字＋下線と `aria-pressed` で示す。 */

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  selected,
  onClick,
  textClassName = '',
}) => {
  return (
    <Button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${textClassName} hover:opacity-70 border-b border-transparent hover:border-current inline-block pb-1 ${
        selected ? 'font-bold border-current' : 'opacity-70'
      }`}
    >
      {category}
    </Button>
  );
};

export default CategoryButton;
