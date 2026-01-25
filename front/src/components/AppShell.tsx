'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppState } from './AppStateProvider';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { theme, currentUser, logout } = useAppState();

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
