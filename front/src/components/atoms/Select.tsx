'use client';

import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

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
