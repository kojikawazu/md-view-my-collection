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
    expect(result.current.report).toEqual(fullReport);
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

  it('should report isLoading only while the full content is being fetched (R-N-4)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => fullReport,
    });

    const { result } = renderHook(() => useReport('r1', listReport));

    // 取得中は一覧のキャッシュを即時表示する
    expect(result.current.isLoading).toBe(true);
    expect(result.current.report).toBe(listReport);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.report?.content).toBe('# Full content here');
    vi.unstubAllEnvs();
  });

  it('should reflect listReport updates in local mode (R-N-5)', () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'local');
    const { result, rerender } = renderHook(({ item }) => useReport('r1', item), {
      initialProps: { item: listReport },
    });

    // id / content が同じでも、タイトル等の変更は即座に反映する（state に写していないため）
    const renamed: ReportItem = { ...listReport, title: 'Renamed' };
    rerender({ item: renamed });
    expect(result.current.report).toBe(renamed);
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

  it('should ignore a stale response after reportId changes (R-S-3)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    const otherList: ReportItem = { ...listReport, id: 'r2', title: 'Other' };
    const otherFull: ReportItem = { ...otherList, content: '# Other content' };

    // r1 の応答は r2 の応答より後に返す（遷移後に古い応答が届く状況）
    let resolveR1: (value: unknown) => void = () => {};
    (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) =>
      url === '/api/reports/r1'
        ? new Promise((resolve) => {
            resolveR1 = resolve;
          })
        : Promise.resolve({ ok: true, json: async () => otherFull }),
    );

    const { result, rerender } = renderHook(({ id, item }) => useReport(id, item), {
      initialProps: { id: 'r1', item: listReport },
    });
    rerender({ id: 'r2', item: otherList });

    await waitFor(() => {
      expect(result.current.report?.content).toBe('# Other content');
    });
    resolveR1({ ok: true, json: async () => fullReport });
    // 古い r1 の応答が届いても、表示は r2 のまま
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.report).toEqual(otherFull);
    vi.unstubAllEnvs();
  });

  it('should not refetch nor drop the full content when listReport arrives later (R-S-4)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'supabase');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => fullReport,
    });

    // 詳細 URL へ直接アクセスし、一覧の取得より先に詳細を開いた状況
    const { result, rerender } = renderHook(({ item }) => useReport('r1', item), {
      initialProps: { item: undefined as ReportItem | undefined },
    });
    await waitFor(() => {
      expect(result.current.report?.content).toBe('# Full content here');
    });

    // 後から一覧（本文なし）が届いても、全文の表示を維持し再取得しない
    rerender({ item: listReport });
    expect(result.current.report).toEqual(fullReport);
    expect(fetch).toHaveBeenCalledTimes(1);
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
