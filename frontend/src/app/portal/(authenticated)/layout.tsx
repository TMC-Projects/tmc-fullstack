import React from 'react';
import { Metadata } from 'next';
import Sidebar from '@/components/portal/Sidebar';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard Klub | NJARA Club',
    template: '%s | NJARA Club',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthenticatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      <Sidebar />
      <div className="flex-1 min-w-0 md:pt-0 pt-16">
        {/* On mobile, pt-16 ensures content starts below the mobile top bar */}
        {children}
      </div>
    </div>
  );
}

