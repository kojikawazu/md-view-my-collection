'use client';

import React, { useEffect, useState } from 'react';
import { DesignSystem } from '../../types';

interface LoginPageProps {
  theme: DesignSystem;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginWithGoogle: () => Promise<string | null>;
}

const LoginPage: React.FC<LoginPageProps> = ({ theme, onLogin, onLoginWithGoogle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colors, fontHeader, borderRadius } = theme;
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam === 'unauthorized') {
      setError('許可されていないメールアドレスです。');
      setIsSubmitting(false);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    void onLogin(email, password).then((message) => {
      setError(message);
      if (message) {
        setIsSubmitting(false);
      }
    });
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    void onLoginWithGoogle().then((message) => {
      setError(message);
      if (message) {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.background} ${colors.text} p-6`}>
      {isSubmitting && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center loading-gradient transition-opacity duration-700">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />
            <span className="text-sm uppercase tracking-[0.3em] text-[#8c7e75]">Loading</span>
          </div>
        </div>
      )}
      <div className={`w-full max-w-md bg-white border ${colors.border} p-12 shadow-2xl ${borderRadius}`}>
        <div className="text-center mb-10">
          <h1 className={`${fontHeader} text-3xl font-bold ${colors.primary} mb-2`}>Report Viewer</h1>
          <p className={`text-sm ${colors.muted} font-medium`}>レポート管理ダッシュボードへアクセス</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {authMode === 'local' ? (
            <>
              <div className="space-y-2">
                <label className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full border ${colors.border} p-4 text-sm ${colors.text} bg-white focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius} placeholder:text-neutral-400`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
                  Password
                </label>
                <input
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
            "Precision is the soul of elegance."
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
