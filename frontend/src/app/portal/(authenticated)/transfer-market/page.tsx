'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { 
  Search, Filter, LogOut, ChevronLeft, ChevronRight, UserCircle, Handshake, DollarSign, Menu, X
, Settings} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  listed_at: string;
  player: TransferMarketPlayer;
}

export default function TransferMarketPage() {
  const router = useRouter();
  const { token, user, _hasHydrated, clearAuth } = useAuthStore();
  const tCommon = useTranslations('Profile');

  // Data State
  const [entries, setEntries] = useState<TransferMarketEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

    fetchTransferMarket();
  }, [_hasHydrated, token, user, page, search, status, fetchTransferMarket, router]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      clearAuth();
      router.push('/portal/login');
    }
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
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transfer Market</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cari dan ajukan penawaran kepada talent yang tersedia.</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari nama atau username..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={status} 
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="free">Free Agent</option>
              <option value="loan">Pinjaman (Loan)</option>
              <option value="transfer">Di Bursa Transfer</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-300 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Talent</th>
                  <th className="px-6 py-4 font-medium">Klub Saat Ini</th>
                  <th className="px-6 py-4 font-medium">Market Value</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Tanggal Masuk</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
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
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                      Tidak ada data di transfer market.
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          entry.status === 'free' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          entry.status === 'transfer' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                          entry.status === 'loan' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                        }`}>
                          {entry.status.toUpperCase()}
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
                            title="Detail Player"
                          >
                            <UserCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Detail</span>
                          </Link>
                          <button 
                            onClick={() => alert('Fitur Penawaran belum diimplementasikan.')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                            title="Ajukan Penawaran"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            Penawaran
                          </button>
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
                Menampilkan halaman {page} dari {totalPages} (Total: {total})
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
