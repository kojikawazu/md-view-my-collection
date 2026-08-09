'use client';

import React from 'react';

interface BadgeProps {
  /** バッジ内に表示する内容（ラベル文字列など）。 */
  children: React.ReactNode;
  /** 追加の Tailwind クラス（色などの見た目を上書きする）。 */
  className?: string;
}

/** カテゴリやステータスを示す小さなラベル用の最小 UI 部品。 */
const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => {
  return (
    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
