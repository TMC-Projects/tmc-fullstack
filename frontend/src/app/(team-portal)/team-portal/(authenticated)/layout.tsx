import React from 'react';
import Sidebar from '@/components/team-portal/Sidebar';

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
