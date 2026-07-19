import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Pemain | NJARA Player',
  description:
    'Masuk ke portal pemain NJARA untuk mengakses trial esports, undangan tim, dan dashboard karir esports Anda. ' +
    'Sign in to your NJARA player account to access esports trials, team invitations, and your esports career dashboard.',
  openGraph: {
    title: 'Login Pemain — NJARA Player Portal',
    description: 'Masuk ke portal pemain esports NJARA. Sign in to your NJARA esports player account.',
    url: 'https://njara.web.id/app/login',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Player Login' }],
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
