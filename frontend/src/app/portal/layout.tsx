import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NJARA Club',
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
