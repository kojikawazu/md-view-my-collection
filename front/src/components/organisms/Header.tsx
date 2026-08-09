'use client';

import React from 'react';
import AppLink from '@/components/atoms/AppLink';
import NavLink from '@/components/molecules/NavLink';
import UserAuthSection from '@/components/molecules/UserAuthSection';
import type { DesignSystem } from '@/types/theme';
import type { User } from '@/types/user';

/** ヘッダーの props。 */
interface HeaderProps {
  /** 配色・フォント・ヘッダー配置スタイルなどのデザインシステム */
  theme: DesignSystem;
  /** ログイン中ユーザー。未ログイン時は `null` */
  user: User | null;
  /** ログアウト操作のコールバック */
  onLogout: () => void;
}

/**
 * グローバルヘッダー。ロゴとナビゲーションを表示する。
 * ログイン時は投稿系リンクとユーザー認証セクションを、未ログイン時はログインボタンを出し分ける。
 * `theme.headerStyle === 'sticky'` の場合は画面上部に固定する。
 */
const Header: React.FC<HeaderProps> = ({ theme, user, onLogout }) => {
  const { colors, fontHeader, headerStyle, borderRadius } = theme;

  return (
    <header
      className={`${
        headerStyle === 'sticky' ? 'fixed top-0 left-0 right-0 z-50' : ''
      } ${colors.surface} ${colors.border} border-b py-4 px-6 flex justify-between items-center transition-all duration-300`}
    >
      <AppLink href="/" className={`${fontHeader} text-2xl font-bold ${colors.primary}`}>
        Report Viewer
      </AppLink>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <NavLink href="/" className={colors.text}>
          Reports
        </NavLink>
        {user ? (
          <>
            <NavLink href="/report/new" className={colors.text}>
              New Post
            </NavLink>
            <NavLink href="/report/markdown-lab" className={colors.text}>
              Markdown Lab
            </NavLink>
            <UserAuthSection
              username={user.username}
              onLogout={onLogout}
              mutedClassName={colors.muted}
              textClassName={colors.text}
              accentClassName={colors.accent}
              borderRadius={borderRadius}
            />
          </>
        ) : (
          <AppLink
            href="/login"
            className={`px-6 py-2 border-2 ${colors.border} ${colors.text} font-bold hover:bg-[#3d2b1f] hover:text-white transition-all ${borderRadius}`}
          >
            Login
          </AppLink>
        )}
      </nav>
    </header>
  );
};

export default Header;
