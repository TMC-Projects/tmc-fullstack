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
  category: 'player' | 'coach' | 'owner' | 'manager' | 'staff' | 'ba';
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      updateUser: (partialUser) => set((state) => ({ user: state.user ? { ...state.user, ...partialUser } : null })),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
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
