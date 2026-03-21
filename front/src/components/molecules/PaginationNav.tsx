'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
  borderClassName?: string;
  borderRadius?: string;
  surfaceClassName?: string;
  textClassName?: string;
  accentClassName?: string;
}

const PaginationNav: React.FC<PaginationNavProps> = ({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  borderClassName = '',
  borderRadius = '',
  surfaceClassName = '',
  textClassName = '',
  accentClassName = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="ページネーション" className="mt-10 flex items-center justify-center gap-2">
      <Button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`min-w-[4.5rem] px-3 py-2 text-sm border ${borderClassName} ${borderRadius} ${
          currentPage === 1 ? 'opacity-40 cursor-not-allowed' : `${surfaceClassName} ${textClassName}`
        }`}
      >
        前へ
      </Button>

      {pageNumbers.map((pageNumber) => (
        <Button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          className={`w-10 h-10 text-sm border ${borderRadius} ${
            pageNumber === currentPage
              ? `${accentClassName} text-white border-transparent`
              : `${surfaceClassName} ${textClassName} ${borderClassName}`
          }`}
        >
          {pageNumber}
        </Button>
      ))}

      <Button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`min-w-[4.5rem] px-3 py-2 text-sm border ${borderClassName} ${borderRadius} ${
          currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : `${surfaceClassName} ${textClassName}`
        }`}
      >
        次へ
      </Button>
    </nav>
  );
};

export default PaginationNav;
