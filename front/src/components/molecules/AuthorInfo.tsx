'use client';

import React from 'react';
import Avatar from '@/components/atoms/Avatar';

interface AuthorInfoProps {
  name: string;
  role?: string;
  subtitle?: string;
  avatarSize?: 'sm' | 'md';
  avatarClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
}

const AuthorInfo: React.FC<AuthorInfoProps> = ({
  name,
  role,
  subtitle,
  avatarSize = 'sm',
  avatarClassName = '',
  nameClassName = '',
  subtitleClassName = '',
}) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={avatarSize} className={avatarClassName} />
      <div>
        <span className={`block font-bold ${nameClassName}`}>{name}</span>
        {role && (
          <span className={`block text-[10px] tracking-wider uppercase font-medium ${subtitleClassName}`}>
            {role}
          </span>
        )}
        {subtitle && !role && (
          <span className={`block ${subtitleClassName}`}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default AuthorInfo;
