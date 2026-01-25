'use client';

import React from 'react';
import Link from 'next/link';
import { DesignSystem, User } from '../types';

interface HeaderProps {
  theme: DesignSystem;
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, user, onLogout }) => {
  const { colors, fontHeader, headerStyle, borderRadius } = theme;

  return (
    <header
      className={`${
        headerStyle === 'sticky' ? 'fixed top-0 left-0 right-0 z-50' : ''
      } ${colors.surface} ${colors.border} border-b py-4 px-6 flex justify-between items-center transition-all duration-300`}
    >
      <Link href="/" className={`${fontHeader} text-2xl font-bold ${colors.primary}`}>
        EarthyDesign <span className="text-sm font-normal opacity-60">Report Blog</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link href="/" className={`${colors.text} hover:opacity-70 transition-opacity`}>
          Reports
        </Link>
        {user ? (
          <>
            <Link href="/report/new" className={`${colors.text} hover:opacity-70 transition-opacity`}>
              New Post
            </Link>
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#e5e1de]">
              <div className="flex flex-col items-end">
                <span className={`text-[9px] uppercase tracking-tighter ${colors.muted} font-bold`}>
                  Authenticated as
                </span>
                <span className={`text-xs font-bold ${colors.text}`}>{user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${colors.accent} text-white hover:brightness-125 transition-all cursor-pointer ${borderRadius} shadow-sm active:scale-95`}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className={`px-6 py-2 border-2 ${colors.border} ${colors.text} font-bold hover:bg-[#3d2b1f] hover:text-white transition-all ${borderRadius}`}
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
