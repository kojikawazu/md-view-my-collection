'use client';

import React, { useState } from 'react';
import { DesignSystem } from '@/types';

/** 確認モーダルの props。 */
interface ConfirmationModalProps {
  /** 配色・フォント・角丸などのデザインシステム */
  theme: DesignSystem;
  /** モーダルの表示可否（false のとき何もレンダリングしない） */
  isOpen: boolean;
  /** キャンセル/確定完了時にモーダルを閉じるコールバック */
  onClose: () => void;
  /** 確定時の処理。非同期可。reject 時はモーダルを閉じず送信状態を復帰する */
  onConfirm: () => void | Promise<void>;
  /** 見出しに表示するタイトル */
  title: string;
  /** 本文に表示する説明メッセージ */
  message: string;
  /** 確定ボタンのラベル */
  confirmLabel: string;
  /** 確定ボタンの見た目。破壊的操作は `danger`（赤系）。既定は `primary` */
  confirmVariant?: 'primary' | 'danger';
}

/**
 * 破壊的操作などの実行前に確認を求める汎用モーダル。
 * 確定処理中は両ボタンを無効化して二重送信を防止し、`onConfirm` が失敗した場合は
 * モーダルを閉じずに送信状態を復帰させて再操作を可能にする。
 */

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  theme,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const { colors, fontHeader, borderRadius } = theme;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* パネル内クリックが背景オーバーレイへ伝播するのを止める（誤クローズ防止） */}
      <div
        className={`${colors.surface} ${colors.border} border p-8 max-w-md w-full shadow-2xl ${borderRadius} animate-in zoom-in-95 duration-200`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4`}>{title}</h3>
        <p className={`text-sm ${colors.muted} leading-relaxed mb-8`}>{message}</p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-6 py-2 text-sm font-bold ${colors.muted} hover:text-black transition-colors disabled:opacity-50`}
          >
            キャンセル
          </button>
          <button
            disabled={isSubmitting}
            onClick={async () => {
              // 送信中の再クリックを弾いて二重実行を防ぐ
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                await onConfirm();
                onClose();
              } catch {
                // onConfirm が失敗: モーダルは閉じない。送信状態は finally で復帰し再操作可能にする
              } finally {
                setIsSubmitting(false);
              }
            }}
            className={`px-8 py-2 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed ${borderRadius} ${
              confirmVariant === 'danger' ? 'bg-red-800' : colors.accent
            }`}
          >
            {isSubmitting ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
