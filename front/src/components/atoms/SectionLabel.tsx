'use client';

import React from 'react';

interface SectionLabelProps {
  /** ラベルとして表示する内容。 */
  children: React.ReactNode;
  /** 追加の Tailwind クラス。 */
  className?: string;
  /** 紐付ける入力要素の id（label の for 属性）。 */
  htmlFor?: string;
}

/** セクション見出しやフォーム項目のラベルに使う、小さな大文字調のラベル部品。 */
const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '', htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className={`text-xs uppercase tracking-widest font-bold ${className}`}>
      {children}
    </label>
  );
};

export default SectionLabel;
