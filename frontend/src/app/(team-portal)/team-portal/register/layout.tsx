import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftarkan Tim Esports | NJARA Teams',
  description:
    'Daftarkan tim esports Anda di NJARA. Buat tim, kelola roster, pantau free agent, dan perkuat skuad esports. ' +
    'Register your esports team on NJARA. Create teams, manage rosters, scout free agents, and strengthen your esports squad.',
  openGraph: {
    title: 'Daftar Tim Esports — NJARA Teams Portal',
    description: 'Daftarkan tim esports Anda di NJARA. Register your esports team on NJARA.',
    url: 'https://njara.web.id/team-portal/register',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Teams Register' }],
  },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
