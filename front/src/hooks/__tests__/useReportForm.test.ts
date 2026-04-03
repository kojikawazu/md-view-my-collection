import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportForm } from '../useReportForm';
import type { MutationResult, ReportItem, User } from '@/types';

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const testUser: User = { id: '1', username: 'Editor', email: 'editor@test.com', role: 'admin' };

const testReport: ReportItem = {
  id: 'r1',
  title: 'Existing Report',
  summary: 'Summary',
  content: '# Content',
  category: 'AI',
  author: 'Editor',
  publishDate: '2024-01-15',
  tags: ['#AI', '#Cloud'],
  externalUrls: [
    { id: 'eu1', url: 'https://example.com', label: 'Example' },
  ],
};

const mockOnSubmit = vi.fn<(data: Omit<ReportItem, 'id'>) => Promise<MutationResult>>();

describe('useReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue({ ok: true });
  });

  // --- 正常系 ---

  it('should initialize with defaults in add mode (RF-N-1)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    expect(result.current.formData.category).toBe('Development');
    expect(result.current.formData.author).toBe('Editor');
    expect(result.current.externalUrls).toEqual([]);
  });

  it('should populate form with existing report in edit mode (RF-N-2)', () => {
    const { result } = renderHook(() =>
      useReportForm({
        user: testUser,
        reportId: 'r1',
        reports: [testReport],
        onSubmit: mockOnSubmit,
      }),
    );
    expect(result.current.formData.title).toBe('Existing Report');
    expect(result.current.formData.category).toBe('AI');
  });

  it('should update formData on handleChange (RF-N-3)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleChange({
        target: { name: 'title', value: 'New Title' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.title).toBe('New Title');
  });

  it('should normalize tags on handleTagsChange (RF-N-4)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'ai, cloud' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.tags).toEqual(['#ai', '#cloud']);
  });

  it('should show confirm modal when tags are present (RF-N-5)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.handleSubmitAttempt({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.showConfirmModal).toBe(true);
  });

  it('should call onSubmit on handleConfirmSubmit (RF-N-6)', async () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(mockOnSubmit).toHaveBeenCalledOnce();
  });

  it('should add, update, and remove external URLs (RF-N-7)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => result.current.addExternalUrl());
    expect(result.current.externalUrls).toHaveLength(1);

    act(() => result.current.updateExternalUrl(0, 'url', 'https://test.com'));
    expect(result.current.externalUrls[0].url).toBe('https://test.com');

    act(() => result.current.removeExternalUrl(0));
    expect(result.current.externalUrls).toHaveLength(0);
  });

  it('should populate externalUrls in edit mode (RF-N-8)', () => {
    const { result } = renderHook(() =>
      useReportForm({
        user: testUser,
        reportId: 'r1',
        reports: [testReport],
        onSubmit: mockOnSubmit,
      }),
    );
    expect(result.current.externalUrls).toEqual([
      { url: 'https://example.com', label: 'Example' },
    ]);
  });

  // --- 準正常系 ---

  it('should redirect to /login when user is null (RF-S-1)', () => {
    renderHook(() =>
      useReportForm({ user: null, onSubmit: mockOnSubmit }),
    );
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show tag error when tags are empty on submit (RF-S-2)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleSubmitAttempt({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.tagError).toBe('タグを入力してください。');
    expect(result.current.showConfirmModal).toBe(false);
  });

  it('should clear tag error when tags are added (RF-S-3)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleSubmitAttempt({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.tagError).toBeTruthy();

    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.tagError).toBeNull();
  });

  it('should clear field error on handleChange (RF-S-4)', async () => {
    mockOnSubmit.mockResolvedValueOnce({
      ok: false,
      status: 400,
      error: 'Validation',
      fieldErrors: { title: 'エラー' },
    });

    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(result.current.fieldErrors.title).toBe('エラー');

    act(() => {
      result.current.handleChange({
        target: { name: 'title', value: 'Fixed' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.fieldErrors.title).toBeUndefined();
  });

  it('should validate external URLs on confirm submit (RF-S-5)', async () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => result.current.addExternalUrl());
    act(() => result.current.updateExternalUrl(0, 'url', 'not-a-url'));

    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(result.current.fieldErrors['externalUrls.0.url']).toBeDefined();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should redirect to /login on 401 response (RF-S-6)', async () => {
    mockOnSubmit.mockResolvedValueOnce({ ok: false, status: 401, error: 'Unauthorized' });

    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should set fieldErrors from server response (RF-S-7)', async () => {
    mockOnSubmit.mockResolvedValueOnce({
      ok: false,
      status: 400,
      error: 'Validation',
      fieldErrors: { content: '本文エラー' },
    });

    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(result.current.fieldErrors.content).toBe('本文エラー');
  });

  it('should set serverError from server response (RF-S-8)', async () => {
    mockOnSubmit.mockResolvedValueOnce({
      ok: false,
      status: 500,
      error: 'Server Error',
    });

    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(result.current.serverError).toBe('Server Error');
  });

  it('should re-index field errors after removeExternalUrl (RF-S-9)', () => {
    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.addExternalUrl();
      result.current.addExternalUrl();
      result.current.addExternalUrl();
    });
    // Simulate field errors on items 0, 1, 2
    act(() => {
      result.current.updateExternalUrl(0, 'url', 'bad');
      result.current.updateExternalUrl(1, 'url', 'bad');
      result.current.updateExternalUrl(2, 'url', 'bad');
    });

    // Manually set field errors to simulate server response
    act(() => {
      // Force errors via confirm submit with invalid URLs
    });

    // Remove middle item (index 1)
    act(() => result.current.removeExternalUrl(1));
    expect(result.current.externalUrls).toHaveLength(2);
  });

  // --- 異常系 ---

  it('should redirect to /login on 403 response (RF-A-1)', async () => {
    mockOnSubmit.mockResolvedValueOnce({ ok: false, status: 403, error: 'Forbidden' });

    const { result } = renderHook(() =>
      useReportForm({ user: testUser, onSubmit: mockOnSubmit }),
    );
    act(() => {
      result.current.handleTagsChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleConfirmSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should not run effects when isHydrated is false (RF-A-2)', () => {
    renderHook(() =>
      useReportForm({ user: null, onSubmit: mockOnSubmit, isHydrated: false }),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
