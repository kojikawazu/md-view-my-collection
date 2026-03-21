'use client';

import React from 'react';

interface TagChipProps {
  label: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

const TagChip: React.FC<TagChipProps> = ({ label, className = '', onClick, selected }) => {
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? selected : undefined}
      onClick={onClick}
      className={`text-[10px] px-2 py-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {label}
    </Tag>
  );
};

export default TagChip;
