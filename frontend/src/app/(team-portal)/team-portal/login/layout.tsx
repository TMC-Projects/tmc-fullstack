import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Portal Tim | NJARA Teams',
  description:
    'Masuk ke portal tim esports NJARA untuk mengelola roster tim, memantau free agent, dan memperkuat skuad esports Anda. ' +
    'Sign in to NJARA Teams Portal to manage esports rosters, scout free agents, and strengthen your esports squad.',
  openGraph: {
    title: 'Login Portal Tim Esports — NJARA Teams',
    description: 'Masuk ke portal tim esports NJARA. Sign in to NJARA Esports Teams Portal.',
    url: 'https://njara.web.id/team-portal/login',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Teams Login' }],
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
