'use client';

import React from 'react';

/** 標準の textarea 要素属性をそのまま受け取る TextArea 用 props。 */
type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** 汎用複数行入力。共通の基本スタイルを付与し、残りの属性はそのまま透過する。 */
const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full bg-white focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default TextArea;
