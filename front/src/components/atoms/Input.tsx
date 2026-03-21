'use client';

import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full bg-white focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default Input;
