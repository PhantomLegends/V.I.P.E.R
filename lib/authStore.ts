import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userName: string;
  authMethod: 'credentials' | 'face-id' | null;
  signIn: (method: 'credentials' | 'face-id') => void;
  signOut: () => void;
}

/** Lightweight client-side auth for the VIPER demo. No real backend yet. */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: 'Alex',
  authMethod: null,
  signIn: (method) => set({ isAuthenticated: true, authMethod: method }),
  signOut: () => set({ isAuthenticated: false, authMethod: null }),
}));
