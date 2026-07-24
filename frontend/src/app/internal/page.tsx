"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Building2, User } from 'lucide-react';

const TABLE_METADATA: Record<string, { title: string, description: string, icon: any }> = {
  "games": {
    title: "Games",
    description: "Manage esports titles available on the platform.",
    icon: Gamepad2
  },
  "subscription_plans": {
    title: "Club Subscriptions",
    description: "Manage B2B subscription plans for clubs and teams.",
    icon: Building2
  },
  "b2c_subscription_plans": {
    title: "B2C Subscriptions",
    description: "Manage B2C subscription plans for individual players.",
    icon: User
  },
  "clubs": {
    title: "Clubs",
    description: "Manage all registered clubs on the platform.",
    icon: Building2
  },
  "club_onboardings": {
    title: "Club Onboardings",
    description: "Manage verification and onboarding requests for clubs.",
    icon: Building2
  },
  "users": {
    title: "Users",
    description: "Manage all user accounts on the platform.",
    icon: User
  }
};

export default function InternalDashboard() {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const token = localStorage.getItem('internal_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/internal/tables`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch tables');
        }
        setTables(data.data.sort());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex p-8 text-zinc-400">Loading modules...</div>;
  }

  if (error) {
    return <div className="text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Back Office Dashboard</h1>
        <p className="text-zinc-400">Select a master data module to manage its records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(tableName => {
          const meta = TABLE_METADATA[tableName] || {
            title: tableName,
            description: "Manage records for this table.",
            icon: null
          };
          
          const IconComponent = meta.icon;

          return (
            <Link 
              key={tableName}
              href={`/internal/tables/${tableName}`}
              className="block p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                  {IconComponent ? (
                    <IconComponent className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                  ) : (
                    <div className="w-6 h-6 bg-zinc-700 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-200 group-hover:text-indigo-400 transition-colors">
                    {meta.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                    {meta.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
