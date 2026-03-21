import { useEffect, useState } from 'react';

interface UseLoginFormOptions {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginWithGoogle: () => Promise<string | null>;
}

export const useLoginForm = ({ onLogin, onLoginWithGoogle }: UseLoginFormOptions) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
