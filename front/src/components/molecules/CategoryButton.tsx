'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface CategoryButtonProps {
  category: string;
  selected: boolean;
  onClick: () => void;
  textClassName?: string;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  selected,
  onClick,
  textClassName = '',
}) => {
  return (
    <Button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${textClassName} hover:opacity-70 border-b border-transparent hover:border-current inline-block pb-1 ${
        selected ? 'font-bold border-current' : 'opacity-70'
      }`}
    >
      {category}
    </Button>
  );
};

export default CategoryButton;
