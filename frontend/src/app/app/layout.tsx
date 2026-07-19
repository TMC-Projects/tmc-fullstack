import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Portal Pemain | NJARA',
    template: '%s | NJARA Player',
  },
  description:
    'Portal pemain NJARA — daftarkan diri, ikuti trial esports, terima undangan tim, dan kelola karir esports Anda. ' +
    'NJARA Player Portal — register, join esports trials, receive team invitations, and manage your esports career.',
  keywords: [
    'portal pemain esports', 'daftar pemain esports', 'trial esports', 'undangan tim esports',
    'rekrutmen esports', 'transfer market esports', 'esports player portal', 'karir esports',
    'free agent esports', 'esports recruitment',
  ],
  openGraph: {
    title: 'NJARA Player Portal — Portal Pemain Esports',
    description:
      'Daftarkan diri, ikuti trial, dan kelola karir esports Anda bersama NJARA. ' +
      'Register, join trials, and manage your esports career with NJARA.',
    url: 'https://njara.web.id/app',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Player Portal' }],
  },
};


export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
