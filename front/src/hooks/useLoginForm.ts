import { useState } from 'react';
import { RATE_LIMIT_MESSAGE } from '@/constants/auth';

/** `useLoginForm` の依存注入。認証処理本体は AppState 側の関数を渡す。 */
interface UseLoginFormOptions {
  /** メール/パスワードでのログイン。成功時 null、失敗時エラーメッセージを返す。 */
  onLogin: (email: string, password: string) => Promise<string | null>;
  /** Google OAuth でのログイン。成功時 null、失敗時エラーメッセージを返す。 */
  onLoginWithGoogle: () => Promise<string | null>;
}

/**
 * URL の `?error=...` を初回レンダー時に解決する（SSR では window 不在のため null）。
 *
 * セッション復元でサインアウトさせられた理由を引き継ぐ。`rate-limited` を分けているのは、
 * レートリミットが許可リストと無関係で、時間をおけば解消するため（Issue #146）。
 *
 * @returns 該当するエラーの日本語メッセージ、該当しなければ `null`
 */
const initialErrorFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const errorParam = new URLSearchParams(window.location.search).get('error');
  if (errorParam === 'unauthorized') return '許可されていないメールアドレスです。';
  if (errorParam === 'rate-limited') return RATE_LIMIT_MESSAGE;
  return null;
};

/** ログインフォームの状態と操作。 */
type UseLoginFormResult = {
  /** メール入力値。 */
  email: string;
  /** メール入力値を更新する。 */
  setEmail: (email: string) => void;
  /** パスワード入力値。 */
  password: string;
  /** パスワード入力値を更新する。 */
  setPassword: (password: string) => void;
  /** 表示中のエラーメッセージ。`null` はエラーなし。初期値は URL の `?error=unauthorized` 由来 */
  error: string | null;
  /** 送信中フラグ。**成功時は遷移するため解除されない**（失敗時のみ false に戻る） */
  isSubmitting: boolean;
  /** メール/パスワードで送信する。未入力の場合は何もしない */
  handleSubmit: (event: React.FormEvent) => void;
  /** Google OAuth を開始する。リダイレクトが走るため成功時は戻ってこない */
  handleGoogleLogin: () => void;
};

/**
 * ログインフォームの状態と送信ハンドラを管理するフック。
 *
 * 入力値・エラー・送信中フラグを保持する。送信成功時は画面遷移が起きるため
 * `isSubmitting` はあえて解除せず、失敗時（メッセージあり）のみ false に戻して再入力を許す。
 *
 * @returns フォームの状態と各ハンドラ
 */
export const useLoginForm = ({
  onLogin,
  onLoginWithGoogle,
}: UseLoginFormOptions): UseLoginFormResult => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialErrorFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // メール/パスワード送信。未入力なら何もしない。
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    void onLogin(email, password).then((message) => {
      setError(message);
      // 成功時は遷移するため解除しない。失敗時のみ再入力できるよう解除する。
      if (message) {
        setIsSubmitting(false);
      }
    });
  };

  // Google OAuth 送信。リダイレクトが走るため成功時は解除しない。
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
