'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Trophy, Award, Calendar, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';

export interface UserAchievement {
  ID: number;
  Title: string;
  Description: string;
  Year: number;
  ImageURL?: string;
}

interface AchievementListProps {
  achievements: UserAchievement[];
  isEditable?: boolean;
  onRefresh?: () => void;
}

export default function AchievementList({ achievements, isEditable, onRefresh }: AchievementListProps) {
  const t = useTranslations('Profile');
  const { token } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserAchievement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (item?: UserAchievement) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.Title || '',
        description: item.Description || '',
        year: item.Year || new Date().getFullYear(),
        image_url: item.ImageURL || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', year: new Date().getFullYear(), image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    showConfirm('Are you sure you want to delete this achievement?', async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/achievements/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error(err);
        showAlert('Failed to delete achievement', 'error');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingItem 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/achievements/${editingItem.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/achievements`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          year: Number(formData.year)
        })
      });
      
      if (!res.ok) throw new Error('Failed to save achievement');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showAlert('Failed to save achievement', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('achievements')}</h2>
        </div>
        {isEditable && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors text-sm font-medium border border-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        )}
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((ach, index) => (
            <motion.div
              key={ach.ID}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg group relative flex flex-col"
            >
              
              {/* Card Content */}
              <div className="p-5 flex flex-col flex-grow">
                {isEditable && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                    <button onClick={() => handleOpenModal(ach)} className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(ach.ID)} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-md">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-bold">{ach.Year}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-amber-500 transition-colors">{ach.Title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-grow">{ach.Description}</p>
                
                {ach.ImageURL && (
                  <div className="mt-auto mb-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-32 relative">
                    <img src={ach.ImageURL} alt={ach.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
              </div>
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
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800 sticky top-0 bg-slate-100 dark:bg-slate-900 z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingItem ? 'Edit Achievement' : 'Add Achievement'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MPL Champion S12"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Short description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-100 dark:bg-slate-900 pb-2">
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
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
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
