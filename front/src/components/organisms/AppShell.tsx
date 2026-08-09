'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import LoadingOverlay from './LoadingOverlay';
import { LoadingProvider } from '@/providers/LoadingContext';
import { useAppState } from '@/hooks/useAppState';

/**
 * アプリ全体のレイアウト骨格。Header / Sidebar / Footer と本文（children）を配置し、
 * 初回ハイドレーションおよびルート遷移時のローディングオーバーレイ表示を制御する。
 * ローディング開始トリガーは `LoadingProvider` 経由で配下コンポーネントへ公開する。
 */
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

  /**
   * 指定遅延後にオーバーレイのフェードアウトを予約する。
   * 既存タイマーがあればクリアして常に最新の1本だけを走らせる（多重発火防止）。
   *
   * @param delayMs - フェードアウト開始までの遅延（ms）
   */
  const scheduleFadeOut = (delayMs: number) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => setFadeOutLoading(true), delayMs);
  };

  /** オーバーレイを即時表示し、最短表示時間の経過後にフェードアウトを予約する。 */
  const startLoading = () => {
    setShowLoading(true);
    setFadeOutLoading(false);
    loadingStartRef.current = Date.now();
    scheduleFadeOut(minDurationMs);
  };

  /**
   * 配下コンポーネントからの手動ローディング開始。
   * 発火時刻を記録し、直後に走るルート遷移由来の二重表示を抑止する。
   */
  const triggerLoading = () => {
    lastManualTriggerRef.current = Date.now();
    startLoading();
  };

  useEffect(() => {
    if (!isHydrated) return;
    const elapsed = Date.now() - (loadingStartRef.current ?? Date.now());
    /** コンテンツfade-inが先行するよう、オーバーレイfade-outに最低200msの猶予を確保 */
    const renderBufferMs = 200;
    const remaining = Math.max(renderBufferMs, minDurationMs - elapsed);
    scheduleFadeOut(remaining);
  }, [isHydrated]);

  // ルート遷移（pathname 変化）でローディングを開始する副作用。
  // ナビゲーション連動のため effect 内 setState は意図的。pathname のみを依存に保つ。
  useEffect(() => {
    const now = Date.now();
    if (lastManualTriggerRef.current && now - lastManualTriggerRef.current < minDurationMs) {
      return;
    }
    startLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex flex-col`}
    >
      <LoadingOverlay
        visible={showLoading}
        fadeOut={fadeOutLoading}
        onFadeOutEnd={() => setShowLoading(false)}
      />
      <LoadingProvider value={{ startLoading: triggerLoading }}>
        <div
          className={`transition-opacity duration-700 ${isHydrated ? 'opacity-100' : 'opacity-0'}`}
        >
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
