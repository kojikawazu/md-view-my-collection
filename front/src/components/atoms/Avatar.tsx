'use client';

import React from 'react';

interface AvatarProps {
  /** 表示名。先頭 1 文字をイニシャルとして描画する。 */
  name: string;
  /** サイズ。省略時は 'sm'（小）。 */
  size?: 'sm' | 'md';
  /** 追加の Tailwind クラス。 */
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
};

/** 表示名のイニシャル（先頭 1 文字）を丸く表示する最小のアバター部品。 */
const Avatar: React.FC<AvatarProps> = ({ name, size = 'sm', className = '' }) => {
  return (
    <div
      className={`${sizeClasses[size]} opacity-20 flex items-center justify-center font-bold ${className}`}
    >
      {name.charAt(0)}
    </div>
  );
};

export default Avatar;
