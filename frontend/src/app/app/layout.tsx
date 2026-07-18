import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NJARA Player',
};

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
