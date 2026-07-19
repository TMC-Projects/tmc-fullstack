import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import GlobalAlertModal from '@/components/GlobalAlertModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://njara.web.id'),
  title: {
    default: 'NJARA — Platform Esports & Rekrutmen Pemain',
    template: '%s | NJARA',
  },
  description:
    'NJARA adalah platform esports terpadu yang mempertemukan pemain dan klub esports Indonesia. ' +
    'Temukan trial, ikuti proses rekrutmen, dan jelajahi transfer market pemain esports. ' +
    'NJARA is an all-in-one esports platform connecting players and esports clubs. ' +
    'Discover trials, go through recruitment, and explore the esports player transfer market.',
  keywords: [
    'NJARA', 'esports', 'platform esports', 'rekrutmen pemain esports', 'manajemen klub esports',
    'transfer market esports', 'trial esports', 'esports Indonesia', 'esports player', 'esports club',
    'free agent esports', 'talent scouting esports', 'esports recruitment platform',
    'jual beli pemain esports', 'esports management',
  ],
  authors: [{ name: 'NJARA', url: 'https://njara.web.id' }],
  creator: 'NJARA',
  publisher: 'NJARA',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: 'en_US',
    url: 'https://njara.web.id',
    siteName: 'NJARA',
    title: 'NJARA — Platform Esports & Rekrutmen Pemain',
    description:
      'Platform esports terpadu yang mempertemukan pemain dan klub esports di Indonesia. ' +
      'All-in-one esports platform connecting players and clubs for recruitment and transfer market.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NJARA — Platform Esports Indonesia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NJARA — Platform Esports & Rekrutmen Pemain',
    description:
      'Platform esports terpadu yang mempertemukan pemain dan klub esports di Indonesia.',
    images: ['/og-image.png'],
    creator: '@njaraesports',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            {children}
            <GlobalAlertModal />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
