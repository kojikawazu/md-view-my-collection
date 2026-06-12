'use client';

import React from 'react';
import LoadingOverlay from './LoadingOverlay';
import { useLoginForm } from '@/hooks/useLoginForm';
import { DesignSystem } from '@/types';

interface LoginFormProps {
  theme: DesignSystem;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginWithGoogle: () => Promise<string | null>;
}

const LoginForm: React.FC<LoginFormProps> = ({ theme, onLogin, onLoginWithGoogle }) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    handleSubmit,
    handleGoogleLogin,
  } = useLoginForm({ onLogin, onLoginWithGoogle });

  const { colors, fontHeader, borderRadius } = theme;
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.background} ${colors.text} p-6`}>
      <LoadingOverlay visible={isSubmitting} />
      <div className={`w-full max-w-md bg-white border ${colors.border} p-12 shadow-2xl ${borderRadius}`}>
        <div className="text-center mb-10">
          <h1 className={`${fontHeader} text-3xl font-bold ${colors.primary} mb-2`}>Report Viewer</h1>
          <p className={`text-sm ${colors.muted} font-medium`}>レポート管理ダッシュボードへアクセス</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {authMode === 'local' ? (
            <>
              <div className="space-y-2">
                <label htmlFor="login-email" className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full border ${colors.border} p-4 text-sm ${colors.text} bg-white focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius} placeholder:text-neutral-400`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`w-full border ${colors.border} p-4 text-sm ${colors.text} bg-white focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius} placeholder:text-neutral-400`}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                className={`w-full py-4 ${colors.accent} text-white font-bold text-sm tracking-widest hover:brightness-125 transition-all uppercase ${borderRadius} mt-4 shadow-sm`}
              >
                Authenticate
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className={`w-full py-4 bg-white border ${colors.border} text-sm font-bold tracking-widest hover:bg-neutral-50 transition-all uppercase ${borderRadius}`}
              >
                Googleアカウントでログイン
              </button>
            </>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>

        <div className={`mt-10 text-center border-t ${colors.border} pt-6`}>
          <p className={`text-[11px] ${colors.muted} italic font-medium`}>
            {'"Precision is the soul of elegance."'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
