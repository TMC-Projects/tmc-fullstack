'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  Search, Filter, Plus, Edit2, Copy, Check, X,
  Shield, Activity, DollarSign, Calendar,
  ChevronLeft, ChevronRight, UserCircle, LogOut, Menu,
  Settings, Trash2, Image as ImageIcon, Contact, Star, RefreshCw, UserMinus
} from "lucide-react";
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAlertStore } from '@/store/alertStore';

interface TalentResult {
  id: number;
  username: string;
  full_name: string;
  email: string;
  category: string;
  bio: string;
  club_id: number;
  contract_until: string | null;
  salary: number | null;
  market_value: number | null;
  transfer_status: string;
  status: string;
  profile_picture_url?: string;
  created_at: string;
}

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.id;
  const router = useRouter();
  const { token, user, _hasHydrated, clearAuth } = useAuthStore();

  // Data State
  const [talents, setTalents] = useState<TalentResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [transferStatus, setTransferStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBiodataOpen, setIsBiodataOpen] = useState(false);
  const [isMarketValueOpen, setIsMarketValueOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isReleaseTeamOpen, setIsReleaseTeamOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [selectedTalent, setSelectedTalent] = useState<TalentResult | null>(null);

  const fetchTalents = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (teamId) queryParams.append('team_id', teamId as string);
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (transferStatus) queryParams.append('transfer_status', transferStatus);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents?${queryParams.toString()}`, {
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
        throw new Error(data.message || 'Failed to fetch talents');
      }

      setTalents(data.data.data || []);
      setTotal(data.data.total || 0);
      setTotalPages(data.data.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, category, transferStatus, token, clearAuth, router]);

  useEffect(() => {
    if (_hasHydrated && token) {
      fetchTalents();
    } else if (_hasHydrated && !token) {
      router.push('/portal/login');
    }
  }, [_hasHydrated, token, fetchTalents, router]);

  const handleLogout = async () => {
    clearAuth();
    router.push('/portal/login');
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20">


      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-6">

        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team Members</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Daftar anggota untuk tim ini.</p>
          </div>
          <button
            onClick={() => router.push('/portal/teams')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Teams
          </button>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">Semua Peran</option>
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="asst_coach">Asst. Coach</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="ba">Brand Ambassador</option>
            </select>
            <select
              value={transferStatus}
              onChange={(e) => { setTransferStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">Semua Status Transfer</option>
              <option value="available">Available (Free Transfer)</option>
              <option value="not_listed">Not Listed</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>

        {/* Talent Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Activity className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
              <p>Memuat data talent...</p>
            </div>
          ) : talents.length === 0 ? (
            <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl py-20 text-center text-slate-500">
              Tidak ada talent yang ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {talents.map((t) => (
                <TalentCard 
                  key={t.id} 
                  talent={t} 
                  onEditBiodata={(talent) => { setSelectedTalent(talent); setIsBiodataOpen(true); }}
                  onEditContract={(talent) => { setSelectedTalent(talent); setIsContractOpen(true); }}
                  onEditMarketValue={(talent) => { setSelectedTalent(talent); setIsMarketValueOpen(true); }}
                  onEditTransferStatus={(talent) => { setSelectedTalent(talent); setIsTransferOpen(true); }}
                  onEditPhoto={(talent) => { setSelectedTalent(talent); setIsPhotoOpen(true); }}
                  onReleaseTeam={(talent) => { setSelectedTalent(talent); setIsReleaseTeamOpen(true); }}
                  onEditStatus={(talent) => { setSelectedTalent(talent); setIsStatusOpen(true); }}
                  onViewDetail={(talent) => { router.push(`/portal/talents/${talent.id}`); }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl">
              <span className="text-sm text-slate-500 dark:text-slate-500">
                Menampilkan halaman {page} dari {totalPages} (Total: {total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {isRegisterOpen && (
        <RegisterTalentModal
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={() => { setIsRegisterOpen(false); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Biodata Modal */}
      {isBiodataOpen && selectedTalent && (
        <EditBiodataModal
          talent={selectedTalent}
          onClose={() => { setIsBiodataOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsBiodataOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Market Value Modal */}
      {isMarketValueOpen && selectedTalent && (
        <MarketValueModal
          talent={selectedTalent}
          onClose={() => { setIsMarketValueOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsMarketValueOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Transfer Status Modal */}
      {isTransferOpen && selectedTalent && (
        <TransferStatusModal
          talent={selectedTalent}
          onClose={() => { setIsTransferOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsTransferOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Contract Modal */}
      {isContractOpen && selectedTalent && (
        <ContractModal
          talent={selectedTalent}
          onClose={() => { setIsContractOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsContractOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Photo Modal */}
      {isPhotoOpen && selectedTalent && (
        <UploadPhotoModal
          talent={selectedTalent}
          onClose={() => { setIsPhotoOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsPhotoOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Release Team Modal */}
      {isReleaseTeamOpen && selectedTalent && (
        <ReleaseTeamModal
          talent={selectedTalent}
          teamId={teamId as string}
          onClose={() => { setIsReleaseTeamOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsReleaseTeamOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

      {/* Status Modal */}
      {isStatusOpen && selectedTalent && (
        <UpdateStatusModal
          talent={selectedTalent}
          onClose={() => { setIsStatusOpen(false); setSelectedTalent(null); }}
          onSuccess={() => { setIsStatusOpen(false); setSelectedTalent(null); fetchTalents(); }}
          token={token || ''}
        />
      )}

    </main>
  );
}

/* =========================================
   SUBCOMPONENTS
========================================= */

function RegisterTalentModal({ onClose, onSuccess, token }: { onClose: () => void, onSuccess: () => void, token: string }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    category: 'player',
    password: '',
    release_clause_enable: false,
    release_clause_amount: 0
  });
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Generate secure password
    const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let pwd = "";
      for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pwd;
    };
    setFormData(prev => ({ ...prev, password: generatePassword() }));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(formData.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mendaftar talent');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tambah Talent Baru</h3>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap</label>
            <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Username</label>
            <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Peran</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none">
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="asst_coach">Asst. Coach</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="ba">Brand Ambassador</option>
            </select>
          </div>

          {(formData.category === 'player' || formData.category === 'coach') && (
            <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={formData.release_clause_enable}
                    onChange={(e) => setFormData({ ...formData, release_clause_enable: e.target.checked })}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.release_clause_enable ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.release_clause_enable ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Aktifkan Release Clause</div>
              </label>

              {formData.release_clause_enable && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nilai Release Clause (IDR)</label>
                  <input 
                    type="number" 
                    value={formData.release_clause_amount || ''} 
                    onChange={e => setFormData({ ...formData, release_clause_amount: parseInt(e.target.value) || 0 })} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" 
                    placeholder="Contoh: 100000000"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Password Sementara</label>
            <div className="flex gap-2">
              <input readOnly type="text" value={formData.password} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-600 dark:text-slate-400 font-mono" />
              <button type="button" onClick={handleCopy} className="p-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Sandi dibuat otomatis. Salin dan berikan kepada talent untuk masuk.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium">
              {isLoading ? 'Menyimpan...' : 'Daftarkan Talent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarketValueModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  const [value, setValue] = useState(talent.market_value?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlertStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsedValue = value ? parseInt(value) : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talent.id}/market-value`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ market_value: parsedValue })
      });
      if (!res.ok) throw new Error('Gagal memperbarui');
      onSuccess();
    } catch (err) {
      showAlert('Gagal memperbarui market value', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Ubah Market Value</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Market Value (IDR)</label>
            <input type="number" placeholder="Kosongkan jika tidak ada" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">{isLoading ? 'Loading...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContractModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  // format YYYY-MM-DD
  const initDate = talent.contract_until ? new Date(talent.contract_until).toISOString().split('T')[0] : '';
  const [contractUntil, setContractUntil] = useState(initDate);
  const [salary, setSalary] = useState(talent.salary?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlertStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsedSalary = salary ? parseInt(salary) : null;
      const parsedDate = contractUntil ? contractUntil : null;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talent.id}/contract-salary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contract_until: parsedDate, salary: parsedSalary })
      });
      if (!res.ok) throw new Error('Gagal memperbarui');
      onSuccess();
    } catch (err) {
      showAlert('Gagal memperbarui kontrak & gaji', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Ubah Kontrak & Gaji</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Kontrak Berakhir</label>
            <input type="date" value={contractUntil} onChange={e => setContractUntil(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 outline-none style-color-scheme-dark" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Gaji (IDR/bulan)</label>
            <input type="number" placeholder="Kosongkan jika tidak ada" value={salary} onChange={e => setSalary(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">{isLoading ? 'Loading...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditBiodataModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  const [formData, setFormData] = useState({
    full_name: talent.full_name || '',
    username: talent.username || '',
    email: talent.email || '',
    category: talent.category || 'player',
    bio: talent.bio || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talent.id}/biodata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui biodata');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Biodata</h3>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap</label>
            <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Peran</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none">
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="asst_coach">Asst. Coach</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="ba">Brand Ambassador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Bio</label>
            <textarea rows={3} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none" placeholder="Tuliskan biografi singkat..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium">
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferStatusModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  const [status, setStatus] = useState('closed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/transfer-market/${talent.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui status transfer');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Update Status Transfer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Pilih Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none">
              <option value="closed">Tidak Dijual (Closed)</option>
              <option value="transfer">Transfer Market</option>
              <option value="loan">Pinjaman (Loan)</option>
              <option value="free">Bebas Transfer (Free Agent)</option>
              <option value="retired">Pensiun (Retired)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">{isLoading ? 'Loading...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateStatusModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  const [status, setStatus] = useState(talent.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talent.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui status');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Update Status Akun</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">{isLoading ? 'Loading...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadPhotoModal({ talent, onClose, onSuccess, token }: { talent: TalentResult, onClose: () => void, onSuccess: () => void, token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(talent.profile_picture_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${talent.profile_picture_url}` : null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Harap pilih file gambar yang valid');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Silakan pilih foto terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${talent.id}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengupload foto');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upload Foto</h3>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">{error}</div>}

          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-sm font-medium">
              Pilih Gambar
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">Batal</button>
            <button type="submit" disabled={isLoading || !file} className="px-4 py-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50 font-medium">
              {isLoading ? 'Mengupload...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TalentCard({ 
  talent, 
  onEditBiodata, 
  onEditContract, 
  onEditMarketValue, 
  onEditTransferStatus,
  onEditPhoto,
  onReleaseTeam,
  onEditStatus,
  onViewDetail
}: { 
  talent: TalentResult,
  onEditBiodata: (t: TalentResult) => void,
  onEditContract: (t: TalentResult) => void,
  onEditMarketValue: (t: TalentResult) => void,
  onEditTransferStatus: (t: TalentResult) => void,
  onEditPhoto: (t: TalentResult) => void,
  onReleaseTeam: (t: TalentResult) => void,
  onEditStatus: (t: TalentResult) => void,
  onViewDetail: (t: TalentResult) => void,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showAlert } = useAlertStore();
  
  const initials = (talent.full_name || talent.username || 'UN').substring(0, 2).toUpperCase();
  
  const getStatus = () => {
    if (talent.status === 'inactive') return { text: 'INACTIVE', color: 'bg-rose-500' };
    if (talent.transfer_status === 'available') return { text: 'TRANSFER', color: 'bg-amber-500' };
    if (talent.transfer_status === 'transferred') return { text: 'INACTIVE', color: 'bg-rose-500' };
    if (talent.contract_until && new Date(talent.contract_until) < new Date()) return { text: 'INACTIVE', color: 'bg-rose-500' };
    return { text: 'ACTIVE', color: 'bg-emerald-500' };
  };

  const status = getStatus();

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[340px] rounded-xl group shadow-xl border border-slate-800 bg-slate-900">
      {/* Background */}
      {talent.profile_picture_url ? (
        <div className="absolute inset-0 bg-slate-900 rounded-xl overflow-hidden">
          <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${talent.profile_picture_url}`} alt={talent.full_name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-cyan-600 flex items-center justify-center rounded-xl overflow-hidden">
          <span className="text-[120px] font-medium text-white opacity-95 tracking-tighter leading-none">{initials}</span>
        </div>
      )}

      {/* Top Left Number */}
      <div className="absolute top-4 left-4">
        <span className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{talent.id || 0}</span>
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
        <button 
          onClick={() => showAlert('Fitur hapus belum tersedia', 'info')}
          className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
          title="Hapus Talent"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={() => onEditPhoto(talent)}
          className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg"
          title="Upload Foto"
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
        </button>
        <button 
          onClick={() => onEditBiodata(talent)}
          className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg"
          title="Edit Biodata"
        >
          <Edit2 className="w-4 h-4 text-amber-400" />
        </button>
        
        {/* Menu Dropdown Container */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg"
            title="Lainnya"
          >
            <Contact className="w-4 h-4 text-amber-400" />
          </button>
          
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => { setIsMenuOpen(false); onEditContract(talent); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-amber-400" /> Kontrak & Gaji
                </button>
                <button 
                  onClick={() => { setIsMenuOpen(false); onEditMarketValue(talent); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-amber-400" /> Market Value
                </button>
                <button 
                  onClick={() => { setIsMenuOpen(false); onEditTransferStatus(talent); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-amber-400" /> Status Transfer
                </button>
                {(talent.category === 'player' || talent.category === 'coach') && (
                  <button 
                    onClick={() => { setIsMenuOpen(false); onReleaseTeam(talent); }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4 text-rose-400" /> Release from Team
                  </button>
                )}
                <div className="border-t border-slate-700 my-1"></div>
                <button 
                  onClick={() => { setIsMenuOpen(false); onViewDetail(talent); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <UserCircle className="w-4 h-4 text-emerald-400" /> Detail
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none rounded-b-xl"></div>

      {/* Bottom Content */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-10">
        {/* Logo */}
        <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center bg-transparent backdrop-blur-md shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <span className="text-white font-black text-sm tracking-tighter">TMC</span>
        </div>
        
        {/* Info */}
        <div className="flex flex-col gap-1 pb-0.5 overflow-hidden w-full">
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-white inline-block w-fit tracking-wider shadow-md uppercase ${status.color}`}>
            {status.text}
          </div>
          <div className="flex items-center gap-1 text-white text-sm font-semibold">
            {/* Using arbitrary 0.0 rating as in the design reference */}
            0.0 <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-white font-bold text-lg leading-tight truncate w-full pr-2 drop-shadow-md">
            {talent.username ? `@${talent.username}` : talent.full_name}
          </div>
          {talent.username && talent.username !== talent.full_name && (
            <div className="text-slate-200 text-xs font-semibold truncate w-full drop-shadow-sm mt-0.5">
              {talent.full_name}
            </div>
          )}
          <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider truncate w-full drop-shadow-sm mt-0.5">
            {talent.category?.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleaseTeamModal({ talent, teamId, onClose, onSuccess, token }: { talent: TalentResult, teamId: string, onClose: () => void, onSuccess: () => void, token: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlertStore();

  const handleRelease = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams/${teamId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: talent.id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal melepaskan pemain dari tim');
      }
      onSuccess();
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Release from Team</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Apakah Anda yakin ingin melepaskan <strong>{talent.full_name || talent.username}</strong> dari tim ini?
        </p>
        <div className="flex justify-center gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700">
            Batal
          </button>
          <button type="button" onClick={handleRelease} disabled={isLoading} className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50">
            {isLoading ? 'Loading...' : 'Release'}
          </button>
        </div>
      </div>
    </div>
  );
}
