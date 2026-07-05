'use client';

import React from 'react';

interface SpinnerProps {
  /** 追加の Tailwind クラス（配置などの調整用）。 */
  className?: string;
  /** スピナー下に表示する文言。省略時は 'Loading'。 */
  label?: string;
}

/** ローディング中を示す回転インジケータとラベルを表示する最小 UI 部品。 */
const Spinner: React.FC<SpinnerProps> = ({ className = '', label = 'Loading' }) => {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />
      <span className="text-sm uppercase tracking-[0.3em] text-[#8c7e75]">{label}</span>
    </div>
  );
};

export default Spinner;
