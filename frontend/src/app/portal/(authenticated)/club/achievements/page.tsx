'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Trophy, Plus, Edit, Trash2, ArrowLeft, X, Link as LinkIcon, Download } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Achievement {
  id: number;
  title: string;
  tournament_name: string;
  game_title: string;
  placement: string;
  achievement_date: string;
  tournament_tier?: string;
  prize_pool_currency?: string;
  prize_pool_amount?: number;
  event_scale?: string;
  reference_url?: string;
  certificate_url?: string;
}

export default function ClubAchievementsPage() {
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();
  const t = useTranslations('ClubAchievements');
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const initialForm = {
    title: '',
    tournament_name: '',
    game_title: '',
    placement: '',
    achievement_date: '',
    tournament_tier: '',
    prize_pool_currency: 'IDR',
    prize_pool_amount: 0,
    event_scale: '',
    reference_url: '',
    certificate_url: ''
  };

  const [form, setForm] = useState(initialForm);

  const fetchClub = useCallback(async () => {
    if (!user?.club_id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.data.achievements || []);
      }
    } catch (err) {
      console.error('Failed to fetch achievements', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.club_id, token]);

  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push('/portal/login');
      } else if (user?.category !== 'owner' && user?.category !== 'manager') {
        router.push('/portal/dashboard');
      } else {
        fetchClub();
      }
    }
  }, [token, user, _hasHydrated, router, fetchClub]);

  const handleOpenModal = (ach: Achievement | null = null) => {
    if (ach) {
      setEditingAch(ach);
      setForm({
        title: ach.title || '',
        tournament_name: ach.tournament_name || '',
        game_title: ach.game_title || '',
        placement: ach.placement || '',
        achievement_date: ach.achievement_date ? new Date(ach.achievement_date).toISOString().split('T')[0] : '',
        tournament_tier: ach.tournament_tier || '',
        prize_pool_currency: ach.prize_pool_currency || 'IDR',
        prize_pool_amount: ach.prize_pool_amount || 0,
        event_scale: ach.event_scale || '',
        reference_url: ach.reference_url || '',
        certificate_url: ach.certificate_url || ''
      });
    } else {
      setEditingAch(null);
      setForm(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAch(null);
    setForm(initialForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.club_id) return;
    setIsSaving(true);
    
    // Process numeric values
    const payload = {
      ...form,
      prize_pool_amount: form.prize_pool_amount ? parseFloat(form.prize_pool_amount.toString()) : 0
    };

    try {
      const url = editingAch 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements/${editingAch.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements`;
      
      const method = editingAch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage(editingAch ? t('save_success_edit') : t('save_success_add'));
        setErrorMessage('');
        handleCloseModal();
        fetchClub();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || t('save_error'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('generic_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    if (!user?.club_id) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMessage(t('delete_success'));
        fetchClub();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(t('delete_error'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('generic_error'));
    }
  };

  if (!_hasHydrated || isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/portal/club/edit" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-[#e50012] dark:hover:text-[#e50012] mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('back_to_profile')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-[#e50012] text-white rounded-lg hover:bg-red-700 transition-colors gap-2 font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t('add_btn')}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {errorMessage}
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {achievements.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t('no_data')}</h3>
            <p className="mt-1">{t('no_data_sub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('col_tournament')}</th>
                  <th className="px-6 py-4 font-medium">{t('col_placement')}</th>
                  <th className="px-6 py-4 font-medium">{t('col_game')}</th>
                  <th className="px-6 py-4 font-medium">{t('col_date')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {achievements.map((ach) => (
                  <tr key={ach.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/50 last:border-0">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-slate-100">{ach.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ach.tournament_name} • {ach.tournament_tier || 'No Tier'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50">
                        {ach.placement}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{ach.game_title}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {ach.achievement_date ? new Date(ach.achievement_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ach.reference_url && (
                          <a href={ach.reference_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Reference Link">
                            <LinkIcon className="w-4 h-4" />
                          </a>
                        )}
                        {ach.certificate_url && (
                          <a href={ach.certificate_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="View Certificate">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleOpenModal(ach)} className="p-2 text-gray-400 hover:text-[#e50012] transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ach.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {editingAch ? t('edit_btn') : t('add_btn')}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_title_label')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder={t('form_title_ph')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_tournament_label')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.tournament_name}
                    onChange={(e) => setForm({...form, tournament_name: e.target.value})}
                    placeholder={t('form_tournament_ph')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_game_label')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.game_title}
                    onChange={(e) => setForm({...form, game_title: e.target.value})}
                    placeholder={t('form_game_ph')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_placement_label')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.placement}
                    onChange={(e) => setForm({...form, placement: e.target.value})}
                    placeholder={t('form_placement_ph')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_date_label')} <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={form.achievement_date}
                    onChange={(e) => setForm({...form, achievement_date: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_tier_label')}</label>
                  <select
                    value={form.tournament_tier}
                    onChange={(e) => setForm({...form, tournament_tier: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  >
                    <option value="">{t('form_tier_ph')}</option>
                    <option value="S-Tier">S-Tier</option>
                    <option value="A-Tier">A-Tier</option>
                    <option value="B-Tier">B-Tier</option>
                    <option value="C-Tier">C-Tier</option>
                    <option value="Local">Local</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_scale_label')}</label>
                  <select
                    value={form.event_scale}
                    onChange={(e) => setForm({...form, event_scale: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  >
                    <option value="">{t('form_scale_ph')}</option>
                    <option value="International">International</option>
                    <option value="Regional">Regional (SEA, etc.)</option>
                    <option value="National">National</option>
                    <option value="Local">Local</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_prize_label')}</label>
                  <div className="flex gap-2">
                    <select
                      value={form.prize_pool_currency}
                      onChange={(e) => setForm({...form, prize_pool_currency: e.target.value})}
                      className="w-24 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                    >
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={form.prize_pool_amount}
                      onChange={(e) => setForm({...form, prize_pool_amount: e.target.value ? parseFloat(e.target.value) : 0})}
                      placeholder={t('form_prize_ph')}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_ref_label')}</label>
                  <input
                    type="url"
                    value={form.reference_url}
                    onChange={(e) => setForm({...form, reference_url: e.target.value})}
                    placeholder="https://"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('form_cert_label')}</label>
                  <input
                    type="url"
                    value={form.certificate_url}
                    onChange={(e) => setForm({...form, certificate_url: e.target.value})}
                    placeholder="https://"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#e50012]/20 focus:border-[#e50012] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e50012] rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSaving ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
