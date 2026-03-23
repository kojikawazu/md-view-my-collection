'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import LoadingOverlay from './LoadingOverlay';
import { LoadingProvider } from '@/providers/LoadingContext';
import { useAppState } from '@/hooks/useAppState';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const {
    theme,
    currentUser,
    logout,
    isHydrated,
    tags,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
  } = useAppState();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(true);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastManualTriggerRef = useRef<number | null>(null);
  /** ローディング最短表示時間（ms）— 手動トリガー抑止の閾値と共用 */
  const minDurationMs = 300;

  useEffect(() => {
    if (loadingStartRef.current === null) {
      loadingStartRef.current = Date.now();
    }
  }, []);

  const scheduleFadeOut = (delayMs: number) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => setFadeOutLoading(true), delayMs);
  };

  const startLoading = () => {
    setShowLoading(true);
    setFadeOutLoading(false);
    loadingStartRef.current = Date.now();
    scheduleFadeOut(minDurationMs);
  };

  const triggerLoading = () => {
    lastManualTriggerRef.current = Date.now();
    startLoading();
  };

  useEffect(() => {
    if (!isHydrated) return;
    const elapsed = Date.now() - (loadingStartRef.current ?? Date.now());
    const remaining = Math.max(0, minDurationMs - elapsed);
    scheduleFadeOut(remaining);
  }, [isHydrated]);

  useEffect(() => {
    const now = Date.now();
    if (lastManualTriggerRef.current && now - lastManualTriggerRef.current < minDurationMs) {
      return;
    }
    startLoading();
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex flex-col`}>
      <LoadingOverlay
        visible={showLoading}
        fadeOut={fadeOutLoading}
        onFadeOutEnd={() => setShowLoading(false)}
      />
      <LoadingProvider value={{ startLoading: triggerLoading }}>
        <div className={`transition-opacity duration-700 ${isHydrated ? 'opacity-100' : 'opacity-0'}`}>
          <Header theme={theme} user={currentUser} onLogout={logout} />
          <div className="flex flex-1 pt-24">
            <Sidebar
              theme={theme}
              tags={tags}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
            <main className="flex-1 overflow-x-hidden">
              {children}
              <Footer theme={theme} />
            </main>
          </div>
        </div>
      </LoadingProvider>
    </div>
  );
};

export default AppShell;
