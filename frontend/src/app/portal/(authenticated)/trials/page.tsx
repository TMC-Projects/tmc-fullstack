'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  Search, Filter, LogOut, ChevronLeft, ChevronRight, UserCircle, Plus, Edit, Menu, X, Gamepad2, Calendar, Users
, Settings} from "lucide-react";
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAlertStore } from '@/store/alertStore';

interface Game {
  id: number;
  name: string;
}

interface Trial {
  ID: number;
  ClubID: number;
  GameID: number;
  Title: string;
  Description: string;
  StartDate: string;
  EndDate: string;
  MaxParticipants: number;
  ParticipantsCount: number;
  Status: string;
}

export default function TrialsPage() {
  const router = useRouter();
  const { token, user, _hasHydrated, clearAuth } = useAuthStore();
  const tCommon = useTranslations('Profile');
  const t = useTranslations('Trials');
  const { showAlert } = useAlertStore();

  // Data State
  const [trials, setTrials] = useState<Trial[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gameId, setGameId] = useState('');
  const [page, setPage] = useState(1);

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game_id: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    status: 'DRAFT'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Games
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games`);
      const data = await res.json();
      if (res.ok) setGames(data.data || []);
    } catch (err) {
      console.error('Failed to fetch games', err);
    }
  }, []);

  // Fetch Trials
  const fetchTrials = useCallback(async () => {
    if (!token || !user?.club_id) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        club_id: user.club_id.toString(),
        ...(status && { status }),
        ...(gameId && { game_id: gameId }),
        ...(search && { search })
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
          router.push('/portal/login');
          return;
        }
        throw new Error(data.message || 'Failed to fetch trials');
      }

      setTrials(data.data.items || []);
      setTotal(data.data.total || 0);
      setTotalPages(Math.ceil((data.data.total || 0) / 10));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, page, status, gameId, router, clearAuth]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/portal/login');
      return;
    }
    if (user?.category !== 'owner' && user?.category !== 'manager' && user?.category !== 'coach' && user?.category !== 'staff') {
      router.push('/portal/dashboard');
      return;
    }

    fetchGames();
    fetchTrials();
  }, [_hasHydrated, token, user, page, status, gameId, fetchGames, fetchTrials, router]);

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

  const openModal = (trial?: Trial) => {
    if (trial) {
      setEditingTrial(trial);
      setFormData({
        title: trial.Title || '',
        description: trial.Description || '',
        game_id: trial.GameID?.toString() || '',
        start_date: trial.StartDate ? trial.StartDate.substring(0, 16) : '',
        end_date: trial.EndDate ? trial.EndDate.substring(0, 16) : '',
        max_participants: trial.MaxParticipants?.toString() || '0',
        status: trial.Status || 'DRAFT'
      });
    } else {
      setEditingTrial(null);
      setFormData({
        title: '',
        description: '',
        game_id: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        status: 'DRAFT'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrial(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    try {
      const url = editingTrial
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials/${editingTrial.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials`;

      const payload = {
        title: formData.title,
        description: formData.description,
        game_id: parseInt(formData.game_id),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        max_participants: parseInt(formData.max_participants),
        ...(editingTrial && { status: formData.status })
      };

      const res = await fetch(url, {
        method: editingTrial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save trial');
      }

      closeModal();
      fetchTrials();
      showAlert('Trial saved successfully', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusUpdate = async (trial: Trial, newStatus: string) => {
    if (!token) return;
    setIsUpdatingStatus(trial.ID);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials/${trial.ID}`;
      const payload = {
        title: trial.Title,
        description: trial.Description,
        game_id: trial.GameID,
        start_date: new Date(trial.StartDate).toISOString(),
        end_date: new Date(trial.EndDate).toISOString(),
        max_participants: trial.MaxParticipants,
        status: newStatus
      };

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      fetchTrials(); // Refresh list to get updated status
      showAlert('Status updated successfully', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!_hasHydrated) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 relative">


      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('title')}</h1>
          </div>
          {(user?.category === 'owner' || user?.category === 'manager' || user?.category === 'staff') && (
            <button
              onClick={() => {
                openModal();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              {t('create_trial')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={gameId}
              onChange={(e) => { setGameId(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 outline-none"
            >
              <option value="">Semua Game</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 outline-none"
            >
              <option value="">{t('all_status')}</option>
              <option value="DRAFT">{t('draft')}</option>
              <option value="PUBLISHED">{t('published')}</option>
              <option value="CLOSED">Closed</option>
              <option value="COMPLETED">{t('completed')}</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-300 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('trial_title')}</th>
                  <th className="px-6 py-4 font-medium">{t('game')}</th>
                  <th className="px-6 py-4 font-medium">{t('period')}</th>
                  <th className="px-6 py-4 font-medium">{t('participants')}</th>
                  <th className="px-6 py-4 font-medium">{t('status')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                      </div>
                      {t('loading')}
                    </td>
                  </tr>
                ) : trials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                      {t('no_data')}
                    </td>
                  </tr>
                ) : (
                  trials.map((trial) => (
                    <tr key={trial.ID} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{trial.Title}</div>
                        <div className="text-slate-500 dark:text-slate-500 text-xs truncate max-w-xs">{trial.Description}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                          {games.find(g => g.id === trial.GameID)?.name || t('unknown')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
                          {t('start_date')}: {trial.StartDate ? formatDate(trial.StartDate) : '-'}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
                          {t('end_date')}: {trial.EndDate ? formatDate(trial.EndDate) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <span className={trial.ParticipantsCount >= (trial.MaxParticipants || 0) && trial.MaxParticipants !== 0 ? 'text-amber-500' : ''}>
                          {trial.ParticipantsCount}
                        </span> / {trial.MaxParticipants || '∞'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <select
                            value={trial.Status || 'DRAFT'}
                            onChange={(e) => handleQuickStatusUpdate(trial, e.target.value)}
                            disabled={isUpdatingStatus === trial.ID}
                            className={`inline-flex items-center pl-3 pr-7 py-0.5 rounded-full text-xs font-medium border outline-none appearance-none cursor-pointer transition-colors ${isUpdatingStatus === trial.ID ? 'opacity-50 cursor-wait' : ''
                              } ${trial.Status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                                trial.Status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' :
                                  trial.Status === 'CLOSED' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20' :
                                      'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              }`}
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.3rem center', backgroundSize: '1em' }}
                          >
                            <option value="DRAFT" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('draft')}</option>
                            <option value="PUBLISHED" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('published')}</option>
                            <option value="CLOSED" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('closed')}</option>
                            <option value="COMPLETED" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('completed')}</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/portal/trials/${trial.ID}/applications`}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={t('view_applicants')}
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openModal(trial)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={t('edit_trial')}
                          >
                            <Edit className="w-4 h-4" />
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

      {/* Modal Add/Edit Trial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingTrial ? 'Edit Trial' : 'Buat Trial Baru'}</h3>
              <button onClick={closeModal} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <form id="trial-form" onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Judul Trial</label>
                  <input
                    required type="text"
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi</label>
                  <textarea
                    required rows={3}
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Game</label>
                  <select
                    required
                    value={formData.game_id} onChange={e => setFormData({ ...formData, game_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none transition-colors"
                  >
                    <option value="" disabled>Pilih Game</option>
                    {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Waktu Mulai</label>
                    <input
                      required type="datetime-local"
                      value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Waktu Selesai</label>
                    <input
                      required type="datetime-local"
                      value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Partisipan</label>
                    <input
                      required type="number" min="1"
                      value={formData.max_participants} onChange={e => setFormData({ ...formData, max_participants: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>
                  {editingTrial && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                      <select
                        required
                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none transition-colors"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="CLOSED">Closed</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button" onClick={closeModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                form="trial-form" type="submit" disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:text-amber-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
