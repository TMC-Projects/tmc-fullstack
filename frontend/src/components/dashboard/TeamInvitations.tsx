'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Check, X, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';

interface Invitation {
  id: number;
  club_id: number;
  team_id: number | null;
  status: string;
  created_at: string;
  club?: {
    id: number;
    name: string;
    logo_url: string;
  };
  team?: {
    id: number;
    name: string;
  };
}

export default function TeamInvitations({ showEmptyState = false }: { showEmptyState?: boolean }) {
  const { token } = useAuthStore();
  const t = useTranslations('Invitations');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvitations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch invitations', err);
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvitation = async (id: number, accept: boolean) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/invitations/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accept })
      });

      if (res.ok) {
        if (accept) {
          window.location.reload(); // Hard reload to fetch new club context on Dashboard
        } else {
          fetchInvitations();
        }
      } else {
        const errorData = await res.json();
        alert(`${t('failed_respond')}: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error responding to invitation', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (isLoading) {
    return (
      <div className="flex justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl mb-8 shadow-sm">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pendingInvitations.length === 0) {
    if (showEmptyState) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{t('no_invitations_title')}</h3>
          <p className="text-slate-500 dark:text-slate-400">{t('no_invitations_desc')}</p>
        </div>
      );
    }
    return null; // Don't show the section if there are no pending invites on dashboard
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border border-indigo-100 dark:border-slate-800 rounded-3xl p-6 mb-8 shadow-sm overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Shield className="w-64 h-64 text-indigo-900" />
      </div>

      <div className="relative z-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          {t('invitation_header')}
        </h2>

        <div className="grid gap-4">
          {pendingInvitations.map((inv) => {
            const displayName = inv.team ? inv.team.name : (inv.club?.name || 'U');
            const initial = displayName.charAt(0).toUpperCase();

            return (
            <div key={inv.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  {inv.club?.logo_url ? (
                    <>
                      <img
                        src={inv.club.logo_url}
                        alt="Club Logo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                          }
                        }}
                      />
                      <span style={{ display: 'none' }} className="font-bold text-xl text-slate-500 dark:text-slate-400">
                        {initial}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-xl text-slate-500 dark:text-slate-400">{initial}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {inv.team ? (
                      <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {t('club_label')}: {inv.club?.name || t('no_invitations_title')}
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {t('main_club')}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => respondToInvitation(inv.id, false)}
                  disabled={isProcessing === inv.id}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors disabled:opacity-50 text-sm font-semibold border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                >
                  <X className="w-4 h-4" /> {t('decline')}
                </button>
                <button
                  onClick={() => respondToInvitation(inv.id, true)}
                  disabled={isProcessing === inv.id}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-indigo-600/20 text-sm font-semibold"
                >
                  {isProcessing === inv.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> {t('accept')}
                    </>
                  )}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
