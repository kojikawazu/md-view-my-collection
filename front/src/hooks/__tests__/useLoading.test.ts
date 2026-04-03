import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { LoadingProvider, useLoading } from '@/providers/LoadingContext';

describe('useLoading', () => {
  it('should call provider startLoading when inside LoadingProvider (L-N-1)', () => {
    const mockStartLoading = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LoadingProvider, { value: { startLoading: mockStartLoading } }, children);

    const { result } = renderHook(() => useLoading(), { wrapper });
    result.current.startLoading();
    expect(mockStartLoading).toHaveBeenCalledOnce();
  });

  it('should return no-op startLoading outside LoadingProvider (L-N-2)', () => {
    const { result } = renderHook(() => useLoading());
    // Should not throw
    expect(() => result.current.startLoading()).not.toThrow();
  });
});
