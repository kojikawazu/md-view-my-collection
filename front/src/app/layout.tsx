import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AppStateProvider } from '../components/AppStateProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Report Viewer',
  description: 'A design-forward report journal for modern teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
