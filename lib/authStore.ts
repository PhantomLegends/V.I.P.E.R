import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userName: string;
  authMethod: 'credentials' | 'face-id' | null;
  signIn: (method: 'credentials' | 'face-id', userName?: string) => void;
  signOut: () => void;
}

/** Lightweight client-side auth for the VIPER demo. Accounts live in lib/userStore (device storage). */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: 'Alex',
  authMethod: null,
  signIn: (method, userName) =>
    set((state) => ({
      isAuthenticated: true,
      authMethod: method,
      userName: userName ?? state.userName,
    })),
  signOut: () => set({ isAuthenticated: false, authMethod: null }),
}));
