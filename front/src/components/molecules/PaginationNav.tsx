'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface PaginationNavProps {
  /** 現在ページ（1始まり）。前へ/次への活性判定と現在番号の強調に使う。 */
  currentPage: number;
  /** 総ページ数。1以下なら nav 自体を描画しない。 */
  totalPages: number;
  /** 表示するページ番号の配列。省略表示などの計算は親側で行う前提。 */
  pageNumbers: number[];
  /** ページ遷移時に呼ぶ。引数は遷移先ページ。 */
  onPageChange: (page: number) => void;
  /** ボタン枠線の追加クラス。 */
  borderClassName?: string;
  /** ボタン角丸の追加クラス。 */
  borderRadius?: string;
  /** 非選択ボタンの背景（サーフェス）クラス。 */
  surfaceClassName?: string;
  /** ボタン文字色の追加クラス。 */
  textClassName?: string;
  /** 現在ページボタンの強調（アクセント背景）クラス。 */
  accentClassName?: string;
}

/** 一覧のページネーション。1ページ以下なら描画しない。前へ/次へと番号ボタンを出す。 */

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
  // 1ページ以下ならページ送りが不要なので nav ごと描画しない。
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="ページネーション" className="mt-10 flex items-center justify-center gap-2">
      <Button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`min-w-[4.5rem] px-3 py-2 text-sm border ${borderClassName} ${borderRadius} ${
          currentPage === 1
            ? 'opacity-40 cursor-not-allowed'
            : `${surfaceClassName} ${textClassName}`
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
          currentPage === totalPages
            ? 'opacity-40 cursor-not-allowed'
            : `${surfaceClassName} ${textClassName}`
        }`}
      >
        次へ
      </Button>
    </nav>
  );
};

export default PaginationNav;
