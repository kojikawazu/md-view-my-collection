import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  // --- 正常系 ---

  it('should calculate totalPages correctly (P-N-1)', () => {
    const { result } = renderHook(() => usePagination(25, 'all'));
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1);
  });

  it('should navigate to page 2 with updatePage (P-N-2)', () => {
    const { result } = renderHook(() => usePagination(25, 'all'));
    act(() => result.current.updatePage(2));
    expect(result.current.currentPage).toBe(2);
  });

  it('should cap page number buttons at maxPageButtons (P-N-3)', () => {
    const { result } = renderHook(() => usePagination(100, 'all'));
    expect(result.current.pageNumbers.length).toBeLessThanOrEqual(5);
  });

  it('should return correct slice with paginateSlice (P-N-4)', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(20, 'all'));
    act(() => result.current.updatePage(2));
    const sliced = result.current.paginateSlice(items);
    expect(sliced).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('should slide page window when on middle page (P-N-5)', () => {
    const { result } = renderHook(() => usePagination(100, 'all'));
    act(() => result.current.updatePage(5));
    expect(result.current.pageNumbers).toEqual([3, 4, 5, 6, 7]);
  });

  it('should fix page window at end (P-N-6)', () => {
    const { result } = renderHook(() => usePagination(100, 'all'));
    act(() => result.current.updatePage(10));
    expect(result.current.pageNumbers).toEqual([6, 7, 8, 9, 10]);
  });

  // --- 準正常系 ---

  it('should return totalPages=1 when totalItems=0 (P-S-1)', () => {
    const { result } = renderHook(() => usePagination(0, 'all'));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });

  it('should reset to page 1 when filterKey changes (P-S-2)', () => {
    const { result, rerender } = renderHook(
      ({ filterKey }) => usePagination(50, filterKey),
      { initialProps: { filterKey: 'AI' } },
    );
    act(() => result.current.updatePage(3));
    expect(result.current.currentPage).toBe(3);

    rerender({ filterKey: 'Cloud' });
    expect(result.current.currentPage).toBe(1);
  });

  it('should clamp page to max when out of range (P-S-3)', () => {
    const { result } = renderHook(() => usePagination(25, 'all'));
    act(() => result.current.updatePage(999));
    expect(result.current.currentPage).toBe(3);
  });

  it('should clamp page to 1 when 0 is given (P-S-4)', () => {
    const { result } = renderHook(() => usePagination(25, 'all'));
    act(() => result.current.updatePage(0));
    expect(result.current.currentPage).toBe(1);
  });

  it('should adjust currentPage when totalItems decreases (P-S-5)', () => {
    const { result, rerender } = renderHook(
      ({ total }) => usePagination(total, 'all'),
      { initialProps: { total: 50 } },
    );
    act(() => result.current.updatePage(5));
    expect(result.current.currentPage).toBe(5);

    rerender({ total: 30 });
    expect(result.current.currentPage).toBe(3);
  });

  // --- 異常系 ---

  it('should handle negative totalItems without crashing (P-A-1)', () => {
    const { result } = renderHook(() => usePagination(-1, 'all'));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });
});
