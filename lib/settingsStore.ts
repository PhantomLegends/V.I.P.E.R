import { create } from 'zustand';

interface SettingsState {
  voice: boolean;
  faceId: boolean;
  tts: boolean;
  toggle: (key: 'voice' | 'faceId' | 'tts') => void;
}

/** Local assistant feature toggles for the VIPER demo. */
export const useSettingsStore = create<SettingsState>((set) => ({
  voice: true,
  faceId: true,
  tts: true,
  toggle: (key) => set((state) => ({ [key]: !state[key] }) as Partial<SettingsState>),
}));
