import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftarkan Klub Esports | NJARA Club',
  description:
    'Daftarkan klub esports Anda di NJARA. Kelola roster, buka trial, rekrut pemain, dan akses transfer market esports. ' +
    'Register your esports club on NJARA. Manage rosters, open trials, recruit players, and access the esports transfer market.',
  openGraph: {
    title: 'Daftar Klub Esports — NJARA Club Portal',
    description: 'Daftarkan klub esports Anda di NJARA. Register your esports club on NJARA.',
    url: 'https://njara.web.id/portal/register',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Club Register' }],
  },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
