'use client';

import React from 'react';
import LoginForm from '@/components/organisms/LoginForm';
import { DesignSystem } from '@/types';

interface LoginPageProps {
  theme: DesignSystem;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginWithGoogle: () => Promise<string | null>;
}

const LoginPage: React.FC<LoginPageProps> = ({ theme, onLogin, onLoginWithGoogle }) => {
  return <LoginForm theme={theme} onLogin={onLogin} onLoginWithGoogle={onLoginWithGoogle} />;
};

export default LoginPage;
