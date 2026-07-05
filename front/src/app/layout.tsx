import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { AppStateProvider } from '@/providers/AppStateProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// 見出し用フォント。英数字・日本語とも Noto Sans JP（ゴシック）で読みやすさを優先する。
// CJK サブセットは巨大なため preload は無効化する（subsets は指定不可）。
const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  weight: ['400', '700'],
  preload: false,
});

export const metadata: Metadata = {
  title: 'Report Viewer',
  description: 'A design-forward report journal for modern teams.',
};

/**
 * アプリ全体のルートレイアウト（サーバーコンポーネント）。
 * 全ページを `AppStateProvider` で包んでグローバル状態を供給し、フォント変数とメタデータを適用する。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} antialiased`}>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
