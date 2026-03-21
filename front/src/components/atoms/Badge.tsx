'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => {
  return (
    <span
      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
