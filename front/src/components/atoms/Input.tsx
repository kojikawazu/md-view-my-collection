'use client';

import React from 'react';

/** 標準の input 要素属性をそのまま受け取る Input 用 props。 */
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** 汎用テキスト入力。共通の基本スタイルを付与し、残りの属性はそのまま透過する。 */
const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full bg-white focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default Input;
