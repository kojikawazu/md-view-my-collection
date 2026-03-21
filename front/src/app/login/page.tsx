'use client';

import LoginPage from '@/components/pages/LoginPage';
import { useAppState } from '@/hooks/useAppState';

export default function LoginRoute() {
  const { theme, login, loginWithGoogle } = useAppState();

  return <LoginPage theme={theme} onLogin={login} onLoginWithGoogle={loginWithGoogle} />;
}
