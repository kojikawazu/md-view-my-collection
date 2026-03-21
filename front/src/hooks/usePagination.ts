import { useState } from 'react';

interface UsePaginationOptions {
  itemsPerPage?: number;
  maxPageButtons?: number;
}

export const usePagination = (
  totalItems: number,
  filterKey: string,
  options: UsePaginationOptions = {},
) => {
  const { itemsPerPage = 10, maxPageButtons = 5 } = options;
  const [paginationState, setPaginationState] = useState(() => ({
    page: 1,
    filterKey,
  }));

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage =
    paginationState.filterKey === filterKey ? Math.min(paginationState.page, safeTotalPages) : 1;

  const pageStart = Math.max(
    1,
    Math.min(currentPage - Math.floor(maxPageButtons / 2), safeTotalPages - maxPageButtons + 1),
  );
  const pageEnd = Math.min(safeTotalPages, pageStart + maxPageButtons - 1);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);

  const updatePage = (nextPage: number) => {
    setPaginationState({
      page: Math.min(Math.max(nextPage, 1), safeTotalPages),
      filterKey,
    });
  };

  const paginateSlice = <T,>(items: T[]): T[] => {
    return items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  };

  return {
    currentPage,
    totalPages: safeTotalPages,
    pageNumbers,
    updatePage,
    paginateSlice,
  };
};
