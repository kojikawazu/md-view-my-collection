import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReport } from '../useReport';
import type { ReportItem } from '@/types/report';

const listReport: ReportItem = {
  id: 'r1',
  title: 'Test',
  summary: 'Sum',
  content: '',
  category: 'AI',
  author: 'Editor',
  tags: ['#AI'],
  externalUrls: [],
};

const fullReport: ReportItem = {
  ...listReport,
  content: '# Full content here',
};

describe('useReport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- 正常系 ---

  it('should use listReport directly in local mode (R-N-1)', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'local');
    const { result } = renderHook(() => useReport('r1', listReport));
    expect(result.current.report).toBe(listReport);
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('should not fetch when listReport has content (R-N-2)', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    const { result } = renderHook(() => useReport('r1', fullReport));
    expect(result.current.report).toBe(fullReport);
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('should fetch from API in supabase mode when content is empty (R-N-3)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => fullReport,
    });

    const { result } = renderHook(() => useReport('r1', listReport));

    await waitFor(() => {
      expect(result.current.report?.content).toBe('# Full content here');
    });
    // repositories 層が GET で叩くこと（ヘッダ等の詳細は repositories の責務）を確認する
    expect(fetch).toHaveBeenCalledWith(
      '/api/reports/r1',
      expect.objectContaining({ method: 'GET' }),
    );
    vi.unstubAllEnvs();
  });

  // --- 準正常系 ---

  it('should not fetch when reportId is undefined (R-S-1)', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    renderHook(() => useReport(undefined, undefined));
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('should keep listReport when API returns non-ok (R-S-2)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useReport('r1', listReport));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.report).toBe(listReport);
    vi.unstubAllEnvs();
  });

  // --- 異常系 ---

  it('should handle fetch exception gracefully (R-A-1)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReport('r1', listReport));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // Should not crash, report falls back to listReport
    expect(result.current.report).toBe(listReport);
    vi.unstubAllEnvs();
  });
});
