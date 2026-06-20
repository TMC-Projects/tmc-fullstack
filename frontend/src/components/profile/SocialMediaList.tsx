'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Globe, Link2, MessageCircle, Briefcase, Video, ExternalLink, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';

export interface UserSocialMedia {
  ID: number;
  Platform: string;
  Username: string;
  URL: string;
}

interface SocialMediaListProps {
  socialMedias: UserSocialMedia[];
  isEditable?: boolean;
  onRefresh?: () => void;
}

const getIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('instagram')) return <MessageCircle className="w-5 h-5" />;
  if (p.includes('twitter') || p.includes('x')) return <MessageCircle className="w-5 h-5" />;
  if (p.includes('linkedin')) return <Briefcase className="w-5 h-5" />;
  if (p.includes('youtube')) return <Video className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

export default function SocialMediaList({ socialMedias, isEditable, onRefresh }: SocialMediaListProps) {
  const t = useTranslations('Profile');
  const { token } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserSocialMedia | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    url: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (item?: UserSocialMedia) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        platform: item.Platform || '',
        username: item.Username || '',
        url: item.URL || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ platform: '', username: '', url: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    showConfirm('Are you sure you want to delete this social media link?', async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/social-media/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error(err);
        showAlert('Failed to delete social media link', 'error');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingItem 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/social-media/${editingItem.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/social-media`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save social media link');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showAlert('Failed to save social media link', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('social_media')}</h2>
        </div>
        {isEditable && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors text-sm font-medium border border-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Add Link
          </button>
        )}
      </div>

      {socialMedias && socialMedias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialMedias.map((sm, index) => (
            <motion.div
              key={sm.ID}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative group"
            >
              <a
                href={sm.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-md transition-all group-hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl transition-colors">
                    {getIcon(sm.Platform)}
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{sm.Platform}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">@{sm.Username}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 transition-colors" />
              </a>

              {isEditable && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg backdrop-blur-sm border border-slate-300 dark:border-slate-800">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleOpenModal(sm); }} 
                    className="p-1.5 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDelete(sm.ID); }} 
                    className="p-1.5 hover:bg-rose-500/30 text-rose-400 rounded-md"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingItem ? 'Edit Social Link' : 'Add Social Link'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Platform</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instagram, YouTube"
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_doe"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Profile URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
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
