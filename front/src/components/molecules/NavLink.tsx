'use client';

import React from 'react';
import AppLink from '@/components/atoms/AppLink';

interface NavLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, className = '', children }) => {
  return (
    <AppLink href={href} className={`hover:opacity-70 transition-opacity ${className}`}>
      {children}
    </AppLink>
  );
};

export default NavLink;
