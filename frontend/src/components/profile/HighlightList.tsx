'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, Video, ExternalLink, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';

export interface UserHighlight {
  ID: number;
  Title: string;
  VideoURL: string;
}

interface HighlightListProps {
  highlights: UserHighlight[];
  isEditable?: boolean;
  onRefresh?: () => void;
}

// Simple helper to extract YouTube ID for iframe embed if possible
const getYoutubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

export default function HighlightList({ highlights, isEditable, onRefresh }: HighlightListProps) {
  const t = useTranslations('Profile');
  const { token } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserHighlight | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    video_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (item?: UserHighlight) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.Title || '',
        video_url: item.VideoURL || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', video_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    showConfirm('Are you sure you want to delete this highlight?', async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/highlights/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error(err);
        showAlert('Failed to delete highlight', 'error');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingItem 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/highlights/${editingItem.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/highlights`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save highlight');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showAlert('Failed to save highlight', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-rose-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('highlights')}</h2>
        </div>
        {isEditable && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors text-sm font-medium border border-rose-500/20"
          >
            <Plus className="w-4 h-4" /> Add Highlight
          </button>
        )}
      </div>

      {highlights && highlights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((hl, index) => {
            const embedUrl = getYoutubeEmbedUrl(hl.VideoURL);
            return (
              <motion.div
                key={hl.ID}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg group relative"
              >
                {isEditable && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                    <button onClick={() => handleOpenModal(hl)} className="p-1.5 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md backdrop-blur-sm">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(hl.ID)} className="p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-md backdrop-blur-sm">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {embedUrl ? (
                  <div className="aspect-video relative">
                    <iframe
                      src={embedUrl}
                      title={hl.Title}
                      className="w-full h-full absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <a
                    href={hl.VideoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-video bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-50"></div>
                    <div className="w-16 h-16 rounded-full bg-rose-500/80 flex items-center justify-center text-white z-10 group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 ml-1" />
                    </div>
                  </a>
                )}
                <div className="p-4 border-t border-slate-300 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 pr-16">{hl.Title}</h3>
                  {!embedUrl && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> External Link
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingItem ? 'Edit Highlight' : 'Add Highlight'}</h3>
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
                    placeholder="e.g. Savage Game 3"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Video URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Must be a valid YouTube URL to be playable.</p>
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
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
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
