import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';

const mockOnLogin = vi.fn<(email: string, password: string) => Promise<string | null>>();
const mockOnLoginWithGoogle = vi.fn<() => Promise<string | null>>();

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLogin.mockResolvedValue(null);
    mockOnLoginWithGoogle.mockResolvedValue(null);
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });
  });

  // --- 正常系 ---

  it('should initialize with empty state (LF-N-1)', () => {
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should call onLogin on handleSubmit with email and password (LF-N-2)', async () => {
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => result.current.setEmail('test@example.com'));
    act(() => result.current.setPassword('pass123'));

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'pass123');
    });
  });

  it('should keep isSubmitting true on successful login (LF-N-3)', async () => {
    mockOnLogin.mockResolvedValue(null);
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => result.current.setEmail('test@example.com'));
    act(() => result.current.setPassword('pass'));

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
    // isSubmitting stays true because message is null (redirect pending)
    expect(result.current.isSubmitting).toBe(true);
  });

  it('should call onLoginWithGoogle on handleGoogleLogin (LF-N-4)', async () => {
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => {
      result.current.handleGoogleLogin();
    });

    await waitFor(() => {
      expect(mockOnLoginWithGoogle).toHaveBeenCalled();
    });
    expect(result.current.isSubmitting).toBe(true);
  });

  // --- 準正常系 ---

  it('should not call onLogin when email/password are empty (LF-S-1)', () => {
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should set error and reset isSubmitting on login failure (LF-S-2)', async () => {
    mockOnLogin.mockResolvedValue('認証失敗');
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => result.current.setEmail('test@example.com'));
    act(() => result.current.setPassword('wrong'));

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('認証失敗');
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should show error when URL has ?error=unauthorized (LF-S-3)', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?error=unauthorized' },
      writable: true,
    });
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    expect(result.current.error).toBe('許可されていないメールアドレスです。');
  });

  it('should set error on Google login failure (LF-S-4)', async () => {
    mockOnLoginWithGoogle.mockResolvedValue('Google認証エラー');
    const { result } = renderHook(() =>
      useLoginForm({ onLogin: mockOnLogin, onLoginWithGoogle: mockOnLoginWithGoogle }),
    );
    act(() => {
      result.current.handleGoogleLogin();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Google認証エラー');
    });
    expect(result.current.isSubmitting).toBe(false);
  });
});
