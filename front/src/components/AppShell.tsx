'use client';

import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppState } from './AppStateProvider';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { theme, currentUser, logout, isHydrated } = useAppState();
  const [showLoading, setShowLoading] = useState(true);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);

  useEffect(() => {
    if (isHydrated) {
      setFadeOutLoading(true);
    }
  }, [isHydrated]);

  return (
    <div className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex flex-col`}>
      {showLoading && (
        <div
          className={`fixed inset-0 z-[999] flex items-center justify-center ${theme.colors.background} transition-opacity duration-500 ${
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
      <div className={`transition-opacity duration-700 ${isHydrated ? 'opacity-100' : 'opacity-0'}`}>
        <Header theme={theme} user={currentUser} onLogout={logout} />
        <div className="flex flex-1 pt-24">
          <Sidebar theme={theme} />
          <main className="flex-1 overflow-x-hidden">
            {children}
            <Footer theme={theme} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
