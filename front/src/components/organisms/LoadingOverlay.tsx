'use client';

import React from 'react';
import Spinner from '@/components/atoms/Spinner';

interface LoadingOverlayProps {
  visible: boolean;
  fadeOut?: boolean;
  onFadeOutEnd?: () => void;
}

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
