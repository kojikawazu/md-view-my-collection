'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface UserAuthSectionProps {
  /** ログイン中ユーザーの表示名。 */
  username: string;
  /** 「Logout」押下時に呼ぶ。ログアウト処理を親に委ねる。 */
  onLogout: () => void;
  /** 補助ラベル（Authenticated as）へ付与する追加クラス。 */
  mutedClassName?: string;
  /** ユーザー名へ付与する追加クラス。 */
  textClassName?: string;
  /** ログアウトボタンの強調（アクセント背景）クラス。 */
  accentClassName?: string;
  /** ログアウトボタンの角丸クラス。 */
  borderRadius?: string;
}

/** ヘッダー右部の認証状態表示。ログイン中ユーザー名とログアウトボタンを並べる。 */

const UserAuthSection: React.FC<UserAuthSectionProps> = ({
  username,
  onLogout,
  mutedClassName = '',
  textClassName = '',
  accentClassName = '',
  borderRadius = '',
}) => {
  return (
    <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#e5e1de]">
      <div className="flex flex-col items-end">
        <span className={`text-[9px] uppercase tracking-tighter ${mutedClassName} font-bold`}>
          Authenticated as
        </span>
        <span className={`text-xs font-bold ${textClassName}`}>{username}</span>
      </div>
      <Button
        onClick={onLogout}
        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${accentClassName} text-white hover:brightness-125 ${borderRadius} shadow-sm active:scale-95`}
      >
        Logout
      </Button>
    </div>
  );
};

export default UserAuthSection;
