'use client';

import React from 'react';
import AppLink from '@/components/atoms/AppLink';

interface NavLinkProps {
  /** リンク先パス/URL。 */
  href: string;
  /** 追加クラス。ホバー時の不透明度アニメーションに上乗せする。 */
  className?: string;
  /** リンクのラベル要素。 */
  children: React.ReactNode;
}

/** ホバーで薄くなるナビゲーション用リンク。内部リンクは AppLink に委譲する。 */

const NavLink: React.FC<NavLinkProps> = ({ href, className = '', children }) => {
  return (
    <AppLink href={href} className={`hover:opacity-70 transition-opacity ${className}`}>
      {children}
    </AppLink>
  );
};

export default NavLink;
