'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppState } from './AppStateProvider';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { theme, currentUser, logout, isHydrated } = useAppState();

  if (!isHydrated) {
    return (
      <div
        className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />
          <span className="text-sm uppercase tracking-[0.3em] text-[#8c7e75]">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.colors.background} ${theme.fontPrimary} ${theme.colors.text} min-h-screen flex flex-col`}>
      <Header theme={theme} user={currentUser} onLogout={logout} />
      <div className="flex flex-1 pt-24">
        <Sidebar theme={theme} />
        <main className="flex-1 overflow-x-hidden">
          {children}
          <Footer theme={theme} />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
