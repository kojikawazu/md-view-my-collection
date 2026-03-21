'use client';

import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => {
  return (
    <label className={`text-xs uppercase tracking-widest font-bold ${className}`}>
      {children}
    </label>
  );
};

export default SectionLabel;
