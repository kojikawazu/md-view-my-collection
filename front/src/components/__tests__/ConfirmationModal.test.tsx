import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ConfirmationModal from '../organisms/ConfirmationModal';
import { ESPRESSO_THEME } from '@/constants/theme';

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  theme: ESPRESSO_THEME,
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
  title: 'テスト確認',
  message: '本当に実行しますか？',
  confirmLabel: '実行する',
  ...overrides,
});

describe('ConfirmationModal', () => {
  afterEach(() => {
    cleanup();
  });

  // --- 正常系 ---

  it('should render title, message, and confirm label when open (M-N-1)', () => {
    render(<ConfirmationModal {...makeProps()} />);
    expect(screen.getByText('テスト確認')).toBeInTheDocument();
    expect(screen.getByText('本当に実行しますか？')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '実行する' })).toBeInTheDocument();
  });

  it('should render nothing when isOpen is false (M-N-2)', () => {
    const { container } = render(<ConfirmationModal {...makeProps({ isOpen: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('should call onConfirm then onClose on confirm click (M-N-3)', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<ConfirmationModal {...props} />);

    await user.click(screen.getByRole('button', { name: '実行する' }));
    expect(props.onConfirm).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('should call only onClose on cancel click (M-N-4)', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<ConfirmationModal {...props} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('should apply bg-red-800 class for danger variant (M-N-5)', () => {
    render(<ConfirmationModal {...makeProps({ confirmVariant: 'danger' })} />);
    const btn = screen.getByRole('button', { name: '実行する' });
    expect(btn.className).toContain('bg-red-800');
  });

  it('should apply accent class for primary variant (M-N-6)', () => {
    render(<ConfirmationModal {...makeProps({ confirmVariant: 'primary' })} />);
    const btn = screen.getByRole('button', { name: '実行する' });
    expect(btn.className).toContain(ESPRESSO_THEME.colors.accent);
  });

  // --- 準正常系 ---

  it('should show "処理中..." and disable button during submission (M-S-1)', async () => {
    const user = userEvent.setup();
    let resolveConfirm!: () => void;
    const props = makeProps({
      onConfirm: vi.fn().mockReturnValue(
        new Promise<void>((res) => {
          resolveConfirm = res;
        }),
      ),
    });
    render(<ConfirmationModal {...props} />);

    const clickPromise = user.click(screen.getByRole('button', { name: '実行する' }));
    const processingBtn = await screen.findByRole('button', { name: '処理中...' });
    expect(processingBtn).toBeDisabled();

    resolveConfirm();
    await clickPromise;
  });

  it('should disable cancel button during submission (M-S-2)', async () => {
    const user = userEvent.setup();
    let resolveConfirm!: () => void;
    const props = makeProps({
      onConfirm: vi.fn().mockReturnValue(
        new Promise<void>((res) => {
          resolveConfirm = res;
        }),
      ),
    });
    render(<ConfirmationModal {...props} />);

    const clickPromise = user.click(screen.getByRole('button', { name: '実行する' }));
    // Wait for processing state to be set
    await screen.findByRole('button', { name: '処理中...' });
    const cancelBtn = screen.getByRole('button', { name: 'キャンセル' });
    expect(cancelBtn).toBeDisabled();

    resolveConfirm();
    await clickPromise;
  });

  it('should prevent double-click on confirm (M-S-3)', async () => {
    const user = userEvent.setup();
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn().mockReturnValue(
      new Promise<void>((res) => {
        resolveConfirm = res;
      }),
    );
    render(<ConfirmationModal {...makeProps({ onConfirm })} />);

    const btn = screen.getByRole('button', { name: '実行する' });
    const clickPromise = user.click(btn);

    const processingBtn = await screen.findByRole('button', { name: '処理中...' });
    await user.click(processingBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);

    resolveConfirm();
    await clickPromise;
  });

  it('should stop propagation on modal content click (M-S-4)', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<ConfirmationModal {...props} />);

    await user.click(screen.getByText('本当に実行しますか？'));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  // --- 異常系 ---

  it('should reset isSubmitting when onConfirm throws (M-A-1)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Fail'));
    const props = makeProps({ onConfirm });

    render(<ConfirmationModal {...props} />);
    await user.click(screen.getByRole('button', { name: '実行する' }));

    const btn = await screen.findByRole('button', { name: '実行する' });
    expect(btn).not.toBeDisabled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('should allow retry after onConfirm error (M-A-2)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('First fail'))
      .mockResolvedValueOnce(undefined);
    const props = makeProps({ onConfirm });

    render(<ConfirmationModal {...props} />);
    await user.click(screen.getByRole('button', { name: '実行する' }));

    const btn = await screen.findByRole('button', { name: '実行する' });
    expect(btn).not.toBeDisabled();

    await user.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
