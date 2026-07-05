'use client';

import React from 'react';
import Avatar from '@/components/atoms/Avatar';

interface AuthorInfoProps {
  /** 著者名。アバターの頭文字生成にも使う。 */
  name: string;
  /** 肩書き。指定時は subtitle より優先して大文字ラベルで表示する。 */
  role?: string;
  /** 補足テキスト。role 未指定のときのみ表示する。 */
  subtitle?: string;
  /** アバターのサイズ。未指定時は `sm`。 */
  avatarSize?: 'sm' | 'md';
  /** アバターへ付与する追加クラス。 */
  avatarClassName?: string;
  /** 著者名へ付与する追加クラス。 */
  nameClassName?: string;
  /** role / subtitle へ付与する追加クラス。 */
  subtitleClassName?: string;
}

/** アバターと著者名（＋肩書き/補足）を横並びで表示する。role と subtitle は role 優先で排他表示。 */

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
