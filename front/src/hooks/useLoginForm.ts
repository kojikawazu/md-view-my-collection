import { useState } from 'react';

interface UseLoginFormOptions {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginWithGoogle: () => Promise<string | null>;
}

/** URL の `?error=unauthorized` を初回レンダー時に解決する（SSR では window 不在のため null）。 */
const initialErrorFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const errorParam = new URLSearchParams(window.location.search).get('error');
  return errorParam === 'unauthorized' ? '許可されていないメールアドレスです。' : null;
};

export const useLoginForm = ({ onLogin, onLoginWithGoogle }: UseLoginFormOptions) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialErrorFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    handleSubmit,
    handleGoogleLogin,
  };
};
