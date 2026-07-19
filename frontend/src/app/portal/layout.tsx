import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Portal Klub | NJARA Club',
    template: '%s | NJARA Club',
  },
  description:
    'Portal manajemen klub esports NJARA — buka trial, rekrut pemain berbakat, kelola roster, dan manfaatkan transfer market esports. ' +
    'NJARA Club Portal — open trials, recruit talented players, manage rosters, and leverage the esports player transfer market.',
  keywords: [
    'portal klub esports', 'manajemen klub esports', 'rekrut pemain esports', 'buka trial esports',
    'transfer market esports', 'roster esports', 'esports club management', 'esports club portal',
    'rekrutmen pemain esports', 'esports scouting',
  ],
  openGraph: {
    title: 'NJARA Club Portal — Manajemen Klub Esports',
    description:
      'Buka trial, rekrut pemain berbakat, dan kelola klub esports Anda bersama NJARA. ' +
      'Open trials, recruit talented players, and manage your esports club with NJARA.',
    url: 'https://njara.web.id/portal',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Club Portal' }],
  },
};


export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
