import { create } from 'zustand';

let eventSource: EventSource | null = null;

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  related_id: number;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  isDropdownOpen: boolean;
  isLoading: boolean;
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: Notification[]) => void;
  setDropdownOpen: (isOpen: boolean) => void;
  fetchUnreadCount: (token: string) => Promise<void>;
  fetchNotifications: (token: string) => Promise<void>;
  markAsRead: (id: number | 'all', token: string) => Promise<void>;
  initSSE: (token: string) => void;
  closeSSE: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isDropdownOpen: false,
  isLoading: false,

  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (notifications) => set({ notifications }),
  setDropdownOpen: (isOpen) => set({ isDropdownOpen: isOpen }),

  fetchUnreadCount: async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ unreadCount: data.data.unread_count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchNotifications: async (token: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ notifications: data.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: number | 'all', token: string) => {
    try {
      const endpoint = id === 'all' ? 'read-all' : id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications/${endpoint}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        if (id === 'all') {
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0
          }));
        } else {
          set((state) => ({
            notifications: state.notifications.map((n) => 
              n.id === id ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  initSSE: (token: string) => {
    if (eventSource) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications/stream?token=${token}`;
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'unread_count') {
          set({ unreadCount: data.payload });
        } else if (data.type === 'new_notification') {
          set((state) => ({
            notifications: [data.payload, ...state.notifications]
          }));
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Browser EventSource automatically reconnects on error
    };
  },

  closeSSE: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }
}));
