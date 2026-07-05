'use client';

import React from 'react';

/** 標準の button 要素属性をそのまま受け取る Button 用 props。 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** 汎用ボタン。共通のトランジション/カーソル指定を付与し、残りの属性はそのまま透過する。 */
const Button: React.FC<ButtonProps> = ({ className = '', ...props }) => {
  return (
    <button
      className={`transition-all cursor-pointer ${className}`}
      {...props}
    />
  );
};

export default Button;
