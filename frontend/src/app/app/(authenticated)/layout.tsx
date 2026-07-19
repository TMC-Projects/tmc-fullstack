import { Metadata } from 'next';
import B2CLayout from '@/components/dashboard/B2CLayout';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard | NJARA Player',
    template: '%s | NJARA Player',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <B2CLayout>
      {children}
    </B2CLayout>
  );
}

