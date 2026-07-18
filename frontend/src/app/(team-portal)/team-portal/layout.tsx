import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NJARA Teams',
};

export default function TeamPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
