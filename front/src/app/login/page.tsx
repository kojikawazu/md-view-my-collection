'use client';

import LoginPage from '@/components/pages/LoginPage';
import { useAppState } from '@/hooks/useAppState';

/**
 * ログイン画面（`/login`・クライアントコンポーネント）。
 * `useAppState` からテーマとログイン手段（通常ログイン・Google OAuth）を取得し、`LoginPage` へ渡す。
 */
export default function LoginRoute() {
  const { theme, login, loginWithGoogle } = useAppState();

  return <LoginPage theme={theme} onLogin={login} onLoginWithGoogle={loginWithGoogle} />;
}
