'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { LoadingProvider } from './LoadingContext';
import { useAppState } from './AppStateProvider';

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
  const minDurationMs = 1000;

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
    if (lastManualTriggerRef.current && now - lastManualTriggerRef.current < 300) {
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
      {showLoading && (
        <div
          className={`fixed inset-0 z-[999] flex items-center justify-center loading-gradient transition-opacity duration-700 ${
            fadeOutLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onTransitionEnd={() => {
            if (fadeOutLoading) setShowLoading(false);
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />
            <span className="text-sm uppercase tracking-[0.3em] text-[#8c7e75]">Loading</span>
          </div>
        </div>
      )}
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
