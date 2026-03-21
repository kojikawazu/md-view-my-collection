'use client';

import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
};

const Avatar: React.FC<AvatarProps> = ({ name, size = 'sm', className = '' }) => {
  return (
    <div
      className={`${sizeClasses[size]} opacity-20 flex items-center justify-center font-bold ${className}`}
    >
      {name.charAt(0)}
    </div>
  );
};

export default Avatar;
