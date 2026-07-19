import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Akun Pemain | NJARA Player',
  description:
    'Daftarkan diri sebagai pemain esports di NJARA. Buat profil, ikuti trial, dan mulai karir esports Anda. ' +
    'Register as an esports player on NJARA. Create your profile, join trials, and start your esports career.',
  openGraph: {
    title: 'Daftar Pemain Esports — NJARA Player Portal',
    description: 'Daftar sebagai pemain esports di NJARA. Register as an esports player on NJARA.',
    url: 'https://njara.web.id/app/register',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Player Register' }],
  },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
