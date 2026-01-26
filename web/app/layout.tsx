import type { Metadata } from 'next';
import { Lexend, Lora, Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google';
import './globals.css';

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const notoSerifJP = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'ragxuary',
  description: 'RAGネイティブなドキュメンテーションツール',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lexend.variable} ${notoSansJP.variable} ${lora.variable} ${notoSerifJP.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
