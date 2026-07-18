"use client";

import React, { useEffect, useRef } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { 
    unreadCount, 
    notifications, 
    isDropdownOpen, 
    isLoading,
    setDropdownOpen, 
    fetchUnreadCount, 
    fetchNotifications, 
    markAsRead,
    initSSE,
    closeSSE
  } = useNotificationStore();
  
  const { token, user } = useAuthStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && user) {
      fetchUnreadCount(token);
      initSSE(token);
      
      return () => {
        closeSSE();
      };
    }
  }, [token, user, fetchUnreadCount, initSSE, closeSSE]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setDropdownOpen]);

  const handleToggle = () => {
    const newOpenState = !isDropdownOpen;
    setDropdownOpen(newOpenState);
    if (newOpenState && token) {
      fetchNotifications(token);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read && token) {
      await markAsRead(notif.id, token);
    }
    setDropdownOpen(false);
    
    // Routing logic
    if (notif.type === 'mention' || notif.type === 'like') {
      router.push(`/app/feed`); 
    } else if (notif.type === 'trial_status' || notif.type === 'new_trial') {
      router.push(`/app/applications`); 
    } else if (notif.type === 'follow') {
      router.push(`/app/profile`); // Ideally we'd navigate to the follower's profile, but /app/profile works for now to see followers.
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => token && markAsRead('all', token)}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.is_read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-violet-500' : 'bg-transparent'}`} />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{notif.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">{notif.message}</p>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
