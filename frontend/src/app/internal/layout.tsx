"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Basic client-side route protection
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('internal_token');
      if (!token && !pathname.includes('/login')) {
        router.push('/internal/login');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [pathname, router]);

  if (!isAuthenticated && !pathname.includes('/login')) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  // If login page, don't show the dashboard layout
  if (pathname.includes('/login')) {
    return <div className="min-h-screen bg-zinc-950 text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex md:flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            NJARA Admin
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Master Data Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col px-4 gap-2">
            <li>
              <Link
                href="/internal"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname === '/internal'
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <div className="px-4 py-2 mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Master Data
              </div>
            </li>
            <li>
              <Link
                href="/internal/tables/games"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/games')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Games
              </Link>
            </li>
            <li>
              <Link
                href="/internal/tables/subscription_plans"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/subscription_plans')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Club Subscriptions
              </Link>
            </li>
            <li>
              <Link
                href="/internal/tables/b2c_subscription_plans"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/b2c_subscription_plans')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                B2C Subscriptions
              </Link>
            </li>
            <li>
              <Link
                href="/internal/tables/clubs"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/clubs')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Clubs
              </Link>
            </li>
            <li>
              <Link
                href="/internal/tables/club_onboardings"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/club_onboardings')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Club Onboardings
              </Link>
            </li>
            <li>
              <Link
                href="/internal/tables/users"
                className={`block px-4 py-2 rounded-lg transition-colors ${pathname.includes('/tables/users')
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
              >
                Users
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button
            className="w-full px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('internal_token');
                window.location.href = '/internal/login';
              }
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 md:hidden">
          <h1 className="text-lg font-bold">NJARA Admin</h1>
        </header>
        <div className="p-6 md:p-8 flex-1 overflow-auto bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
