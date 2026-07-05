'use client';

import React from 'react';
import Spinner from '@/components/atoms/Spinner';

/** ローディングオーバーレイの props。 */
interface LoadingOverlayProps {
  /** オーバーレイの表示可否（false のとき何もレンダリングしない） */
  visible: boolean;
  /** true でフェードアウト（透明化）を開始する。既定は false */
  fadeOut?: boolean;
  /** フェードアウトのトランジション完了時に呼ばれるコールバック */
  onFadeOutEnd?: () => void;
}

/**
 * 画面全体を覆うローディングオーバーレイ。中央にスピナーを表示する。
 * `fadeOut` で透明化し、CSS トランジション完了（`onTransitionEnd`）を検知して
 * `onFadeOutEnd` を呼ぶことで、呼び出し側が実際の非表示（アンマウント）を制御できる。
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  fadeOut = false,
  onFadeOutEnd,
}) => {
  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center loading-gradient transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onTransitionEnd={() => {
        if (fadeOut && onFadeOutEnd) onFadeOutEnd();
      }}
    >
      <Spinner />
    </div>
  );
};

export default LoadingOverlay;
