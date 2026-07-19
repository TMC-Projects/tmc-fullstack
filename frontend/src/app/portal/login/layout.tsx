import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Portal Klub | NJARA Club',
  description:
    'Masuk ke portal manajemen klub esports NJARA untuk mengelola roster, membuka trial, merekrut pemain, dan mengakses transfer market. ' +
    'Sign in to NJARA Club Portal to manage rosters, open trials, recruit players, and access the esports transfer market.',
  openGraph: {
    title: 'Login Portal Klub Esports — NJARA Club',
    description: 'Masuk ke portal manajemen klub esports NJARA. Sign in to NJARA Esports Club Portal.',
    url: 'https://njara.web.id/portal/login',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NJARA Club Login' }],
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
