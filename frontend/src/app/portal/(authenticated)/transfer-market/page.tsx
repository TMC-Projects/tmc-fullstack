'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  Search, ChevronLeft, ChevronRight, UserCircle, Handshake
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useAlertStore } from '@/store/alertStore';
import { useTranslations } from 'next-intl';

interface TransferMarketPlayer {
  id: number;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  category: string;
  market_value: number | null;
  salary: number | null;
  club?: { name: string };
}

interface TransferMarketEntry {
  id: number;
  user_id: number;
  status: string;
  has_pending_invitation?: boolean;
  listed_at: string;
  player: TransferMarketPlayer;
}

export default function TransferMarketPage() {
  const router = useRouter();
  const { token, user, _hasHydrated, clearAuth } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  const t = useTranslations('TransferMarket');

  // Data State
  const [entries, setEntries] = useState<TransferMarketEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [requestedIds, setRequestedIds] = useState<number[]>([]);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('transfer_market_requested_ids');
      if (stored) {
        setRequestedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse requested ids', e);
    }
  }, []);

  // Update local storage when it changes
  useEffect(() => {
    if (requestedIds.length > 0) {
      localStorage.setItem('transfer_market_requested_ids', JSON.stringify(requestedIds));
    }
  }, [requestedIds]);

  const fetchTransferMarket = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && { status })
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/transfer-market?${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
          router.push('/portal/login');
          return;
        }
        throw new Error(data.message || 'Failed to fetch transfer market');
      }

      setEntries(data.data.data || []);
      setTotal(data.data.total || 0);
      setTotalPages(Math.ceil((data.data.total || 0) / 10));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, search, status, router, clearAuth]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/portal/login');
      return;
    }
    // RBAC: Only owner and manager
    if (user?.category !== 'owner' && user?.category !== 'manager') {
      router.push('/portal/dashboard');
      return;
    }

    const timer = setTimeout(() => {
      fetchTransferMarket();
    }, 0);
    return () => clearTimeout(timer);
  }, [_hasHydrated, token, user, page, search, status, fetchTransferMarket, router]);

  const handleSignFreeAgent = async (talentId: number, fullName: string) => {
    showConfirm(`Apakah Anda yakin ingin men-sign free agent ${fullName}?`, async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talentId}/sign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.message && data.message.includes('already sent a pending invitation')) {
            showAlert('Anda sudah pernah mengirim undangan ke pemain ini.', 'info');
            setRequestedIds(prev => prev.includes(talentId) ? prev : [...prev, talentId]);
            return;
          }
          throw new Error(data.message || 'Failed to sign free agent');
        }

        showAlert(`Berhasil sign in ${fullName}!`, 'success');
        setRequestedIds(prev => prev.includes(talentId) ? prev : [...prev, talentId]);
        fetchTransferMarket(); // refresh the list
      } catch (err) {
        showAlert(`Error: ${(err as Error).message}`, 'error');
      }
    });
  };



  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!_hasHydrated) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20">


      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('title')}</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">{t('all_status')}</option>
              <option value="free">{t('free_agent')}</option>
              <option value="transfer">{t('transfer_listed')}</option>
              <option value="loan">{t('loan_listed')}</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-300 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('talent')}</th>
                  <th className="px-6 py-4 font-medium">{t('current_club')}</th>
                  <th className="px-6 py-4 font-medium">{t('market_value')}</th>
                  <th className="px-6 py-4 font-medium">{t('status')}</th>
                  <th className="px-6 py-4 font-medium">{t('listed_date')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                      </div>
                      Memuat data...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {t('no_data')}
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.player.profile_picture_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-500/20">
                              <Image
                                src={entry.player.profile_picture_url.startsWith('http') ? entry.player.profile_picture_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${entry.player.profile_picture_url}`}
                                alt={entry.player.full_name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/20">
                              {entry.player.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.player.full_name}</div>
                            <div className="text-slate-500 dark:text-slate-500 text-xs flex items-center gap-2">
                              @{entry.player.username}
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="uppercase text-[10px] tracking-wider text-amber-500/80">{entry.player.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {entry.player.club?.name || 'Free Agent'}
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-400">
                        {formatCurrency(entry.player.market_value)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${entry.status === 'free' ? 'bg-emerald-500/10 text-emerald-500' :
                          entry.status === 'transfer' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                          {entry.status === 'free' ? t('free_agent') : entry.status === 'transfer' ? t('transfer_listed') : t('loan_listed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {formatDate(entry.listed_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/portal/players/${entry.player.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            <UserCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Detail</span>
                          </Link>
                          {entry.status === 'free' ? (() => {
                            const isRequested = entry.has_pending_invitation || requestedIds.includes(entry.player.id);
                            return (
                              <button
                                onClick={() => handleSignFreeAgent(entry.player.id, entry.player.full_name)}
                                disabled={isRequested}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                                  isRequested
                                    ? 'bg-slate-500/10 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                }`}
                              >
                                <Handshake className="w-4 h-4" />
                                {isRequested ? 'Requested' : t('sign_in')}
                              </button>
                            );
                          })() : (
                            <button
                              onClick={() => showAlert('Fitur Penawaran belum diimplementasikan.', 'info')}
                              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                            >
                              <Handshake className="w-3.5 h-3.5" />
                              {t('offer')}
                            </button>
                          )}
                        </div>

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-300 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('showing_page', { page, totalPages, total })}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
