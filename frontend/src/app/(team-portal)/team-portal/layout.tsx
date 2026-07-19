import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Portal Tim | NJARA Teams',
    template: '%s | NJARA Teams',
  },
  description:
    'Portal manajemen tim esports NJARA — buat tim, kelola roster, pantau free agent, dan perkuat skuad esports Anda. ' +
    'NJARA Teams Portal — create teams, manage rosters, scout free agents, and strengthen your esports squad.',
  keywords: [
    'portal tim esports', 'manajemen tim esports', 'free agent esports', 'skuad esports',
    'roster tim esports', 'esports team management', 'esports team portal', 'esports squad',
    'esports free agent scouting', 'transfer market esports',
  ],
  openGraph: {
    title: 'NJARA Teams Portal — Manajemen Tim Esports',
    description:
      'Buat tim, kelola roster, dan perkuat skuad esports Anda bersama NJARA. ' +
      'Create teams, manage rosters, and strengthen your esports squad with NJARA.',
    url: 'https://njara.web.id/team-portal',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Teams Portal' }],
  },
};


export default function TeamPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
