'use client';

import React from 'react';

/** 標準の select 要素属性をそのまま受け取る Select 用 props。 */
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** 汎用セレクトボックス。共通の基本スタイルを付与し、残りの属性はそのまま透過する。 */
const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  return (
    <select
      className={`w-full bg-white focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;
