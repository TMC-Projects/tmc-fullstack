import B2CLayout from '@/components/dashboard/B2CLayout';

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
