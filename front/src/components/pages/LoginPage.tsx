'use client';

import React from 'react';
import LoginForm from '@/components/organisms/LoginForm';
import { DesignSystem } from '@/types';

interface LoginPageProps {
  /** テーマ（配色・フォント・角丸などのデザイントークン一式） */
  theme: DesignSystem;
  /** メール／パスワードでのログイン処理。失敗時はエラーメッセージ、成功時は null を返す */
  onLogin: (email: string, password: string) => Promise<string | null>;
  /** Google OAuth でのログイン処理。失敗時はエラーメッセージ、成功時は null を返す */
  onLoginWithGoogle: () => Promise<string | null>;
}

/**
 * ログイン画面。実体の入力フォーム・送信処理は LoginForm 組織体に委譲する薄い
 * ページラッパー。テーマとログインハンドラをそのまま受け渡す。
 */
const LoginPage: React.FC<LoginPageProps> = ({ theme, onLogin, onLoginWithGoogle }) => {
  return <LoginForm theme={theme} onLogin={onLogin} onLoginWithGoogle={onLoginWithGoogle} />;
};

export default LoginPage;
