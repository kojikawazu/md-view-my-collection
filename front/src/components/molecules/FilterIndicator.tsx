'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface FilterIndicatorProps {
  category: string | null;
  tag: string | null;
  onClear: () => void;
  badgeClassName?: string;
  mutedClassName?: string;
}

const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  category,
  tag,
  onClear,
  badgeClassName = '',
  mutedClassName = '',
}) => {
  if (!category && !tag) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
      <span className={mutedClassName}>Filter</span>
      {category && (
        <span className={`px-2 py-1 border ${badgeClassName}`}>{category}</span>
      )}
      {tag && (
        <span className={`px-2 py-1 border ${badgeClassName}`}>#{tag}</span>
      )}
      <Button
        type="button"
        onClick={onClear}
        className={`text-[10px] ${mutedClassName} border-b border-transparent hover:border-current`}
      >
        Clear
      </Button>
    </div>
  );
};

export default FilterIndicator;
