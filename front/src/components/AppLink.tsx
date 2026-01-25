'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useLoading } from './LoadingContext';

type AppLinkProps = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const AppLink = ({ onClick, ...props }: AppLinkProps) => {
  const { startLoading } = useLoading();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    startLoading();
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
};

export default AppLink;
