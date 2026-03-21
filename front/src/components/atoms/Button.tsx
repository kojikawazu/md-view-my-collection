'use client';

import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ className = '', ...props }) => {
  return (
    <button
      className={`transition-all cursor-pointer ${className}`}
      {...props}
    />
  );
};

export default Button;
