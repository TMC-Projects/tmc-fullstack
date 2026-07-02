'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Calendar, Activity, Edit2, X, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { User as AuthUser, useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';

interface ProfileHeaderProps {
  user: AuthUser;
  isEditable?: boolean;
  onRefresh?: () => void;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

export default function ProfileHeader({ 
  user, 
  isEditable, 
  onRefresh,
  followersCount,
  followingCount,
  isFollowing,
  onFollowToggle
}: ProfileHeaderProps) {
  const t = useTranslations('Profile');
  const { token } = useAuthStore();
  const { showAlert } = useAlertStore();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    bio: user.bio || '',
    language: user.language || 'en'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setIsEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showAlert('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('File size must be less than 5MB', 'warning');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/profile/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload photo');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showAlert('Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
        {/* Avatar */}
        <div 
          className={`relative w-32 h-32 rounded-full border-2 border-violet-500/30 flex flex-col items-center justify-center shadow-lg shadow-violet-900/20 flex-shrink-0 overflow-hidden ${isEditable ? 'cursor-pointer group' : ''}`}
          onClick={() => isEditable && fileInputRef.current?.click()}
        >
          {user.profile_picture_url ? (
            <img 
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${user.profile_picture_url}`} 
              alt={user.full_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
              <User className="w-16 h-16 text-violet-400" />
            </div>
          )}
          
          {isEditable && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 <span className="text-white text-xs font-semibold">Change Photo</span>
              )}
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/jpeg, image/png, image/webp" 
          onChange={handleFileChange} 
        />

        {/* User Info */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                {user.full_name}
              </h1>
              
              {!isEditable && onFollowToggle && (
                <button
                  onClick={onFollowToggle}
                  className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                    isFollowing 
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/50 border border-transparent' 
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">@{user.username}</p>
          </div>
          
          {(followersCount !== undefined || followingCount !== undefined) && (
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
              {followersCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{followersCount}</span>
                  <span className="text-slate-600 dark:text-slate-400">Followers</span>
                </div>
              )}
              {followingCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{followingCount}</span>
                  <span className="text-slate-600 dark:text-slate-400">Following</span>
                </div>
              )}
            </div>
          )}

          {user.bio && (
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              {user.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              {user.club_name ? user.club_name : `Club ID: ${user.club_id}`}
            </span>
            
            {/* Optional Fields (if accessible) */}
            {user.contract_until && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {t('contract_until')}: {new Date(user.contract_until).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isEditable && (
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 right-4 md:static md:top-auto md:right-auto bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-xl transition-colors"
            title="Edit Profile"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Bio</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Preferred Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
