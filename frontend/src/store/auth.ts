import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  language: string;
  bio: string;
  club_id: number;
  club_name?: string;
  club_logo_url?: string;
  verify?: boolean;
  category: 'player' | 'coach' | 'owner' | 'manager' | 'staff' | 'ba' | 'team_owner';
  contract_until?: string;
  salary?: number;
  market_value?: number;
  profile_picture_url?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateUser: (partialUser: Partial<User>) => void;
  clearAuth: () => void;
  /** Attempt to refresh the access token. Returns the new token or null if failed. */
  refreshAccessToken: () => Promise<string | null>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      updateUser: (partialUser) => set((state) => ({ user: state.user ? { ...state.user, ...partialUser } : null })),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
      refreshAccessToken: async () => {
        const { refreshToken, user, clearAuth } = get();
        if (!refreshToken || !user) {
          clearAuth();
          return null;
        }
        try {
          const res = await fetch(`${BASE_URL}/api/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!res.ok) {
            clearAuth();
            return null;
          }
          const data = await res.json();
          const newToken: string = data.data?.token ?? data.token;
          const newRefreshToken: string = data.data?.refresh_refresh_token ?? data.data?.refresh_token ?? data.refresh_token ?? refreshToken;
          if (!newToken) {
            clearAuth();
            return null;
          }
          set({ token: newToken, refreshToken: newRefreshToken });
          return newToken;
        } catch {
          clearAuth();
          return null;
        }
      },
    }),
    {
      name: 'njara-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
