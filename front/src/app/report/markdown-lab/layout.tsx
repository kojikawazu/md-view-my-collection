import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME } from '@/constants/auth';

/**
 * Markdown スタイル検証ラボの認証ゲート付きレイアウト（サーバーコンポーネント）。
 * 認証 Cookie を検証し、未ログインなら `/login` へリダイレクトして配下のラボページへのアクセスを制限する。
 */
export default async function MarkdownLabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (authCookie !== '1') {
    redirect('/login');
  }

  return <>{children}</>;
}
