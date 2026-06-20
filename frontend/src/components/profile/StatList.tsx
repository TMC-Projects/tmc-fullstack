'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Target, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export interface UserStat {
  ID: number;
  GameID: number;
  Game?: {
    Name?: string;
    name?: string;
  };
  StatName: string;
  StatValue: string;
}

interface StatListProps {
  stats: UserStat[];
  isEditable?: boolean;
  onRefresh?: () => void;
}

export default function StatList({ stats, isEditable, onRefresh }: StatListProps) {
  const t = useTranslations('Profile');
  const { token } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<UserStat | null>(null);
  const [formData, setFormData] = useState({
    game_id: 1,
    stat_name: '',
    stat_value: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [games, setGames] = useState<any[]>([]);

  // Fetch games for dropdown
  useEffect(() => {
    if (isEditable) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setGames(data.data);
          }
        })
        .catch(console.error);
    }
  }, [isEditable]);

  const handleOpenModal = (stat?: UserStat) => {
    if (stat) {
      setEditingStat(stat);
      setFormData({
        game_id: stat.GameID || 1,
        stat_name: stat.StatName || '',
        stat_value: stat.StatValue || ''
      });
    } else {
      setEditingStat(null);
      const defaultId = games.length > 0 ? (games[0].id || games[0].ID || 1) : 1;
      setFormData({ game_id: defaultId, stat_name: '', stat_value: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/stats/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete stat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingStat 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/stats/${editingStat.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/stats`;
      
      const method = editingStat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          game_id: Number(formData.game_id) || 1
        })
      });
      
      if (!res.ok) throw new Error('Failed to save stat');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save stat');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('stats')}</h2>
        </div>
        {isEditable && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors text-sm font-medium border border-cyan-500/20"
          >
            <Plus className="w-4 h-4" /> Add Stat
          </button>
        )}
      </div>

      {stats && stats.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.ID}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg transition-all relative group"
            >
              {isEditable && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleOpenModal(stat)} className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(stat.ID)} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-md">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2 mt-1">
                {stat.Game?.Name || stat.Game?.name || 'Unknown Game'}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">
                {stat.StatName}
              </span>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {stat.StatValue}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-100/30 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-8 text-center">
          <p className="text-slate-500 dark:text-slate-500 italic">{t('no_data')}</p>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingStat ? 'Edit Stat' : 'Add Stat'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Game</label>
                  <select
                    required
                    value={formData.game_id}
                    onChange={(e) => setFormData({...formData, game_id: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="" disabled>Select Game</option>
                    {games.map(g => {
                      const gid = g.id || g.ID;
                      const gname = g.name || g.Name;
                      return <option key={gid} value={gid}>{gname}</option>
                    })}
                    {games.length === 0 && <option value="1">Mobile Legends</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Stat Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Win Rate, Matches Played"
                    value={formData.stat_name}
                    onChange={(e) => setFormData({...formData, stat_name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Stat Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 85%, 1500"
                    value={formData.stat_value}
                    onChange={(e) => setFormData({...formData, stat_value: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
