'use client';

import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '', htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className={`text-xs uppercase tracking-widest font-bold ${className}`}>
      {children}
    </label>
  );
};

export default SectionLabel;
