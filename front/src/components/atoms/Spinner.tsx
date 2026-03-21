'use client';

import React from 'react';

interface SpinnerProps {
  className?: string;
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = '', label = 'Loading' }) => {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />
      <span className="text-sm uppercase tracking-[0.3em] text-[#8c7e75]">{label}</span>
    </div>
  );
};

export default Spinner;
