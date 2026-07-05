'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useLoading } from '@/hooks/useLoading';

/** next/link の props とアンカー要素の属性を合成した AppLink 用 props。 */
type AppLinkProps = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * 遷移時にローディング表示を起動する next/link ラッパー。
 *
 * クリック時に先にグローバルのローディングを開始してから、渡された onClick を実行する。
 */
const AppLink = ({ onClick, ...props }: AppLinkProps) => {
  const { startLoading } = useLoading();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    startLoading();
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
};

export default AppLink;
