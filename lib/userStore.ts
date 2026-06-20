import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/** A locally stored VIPER account. This is a device-only "test database" — no server. */
export interface StoredUser {
  /** Login identifier the user types into "Enter ID". Stored lowercased. */
  id: string;
  /** Display name shown across the app. */
  name: string;
  /** Plaintext passcode. Local test-only; do NOT use this scheme with a real backend. */
  passcode: string;
}

/** The single test account that ships with the app so sign-in works out of the box. */
export const SEED_USER: StoredUser = {
  id: 'alex',
  name: 'Alex',
  passcode: '1234',
};

const STORAGE_KEY = 'viper.users.v1';

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== 'object' || value === null) return false;
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- widening cast required in type guard; object is narrowed to non-null above
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['id'] === 'string' &&
    typeof obj['name'] === 'string' &&
    typeof obj['passcode'] === 'string'
  );
}

export type VerifyResult =
  | { ok: true; user: StoredUser }
  | { ok: false; reason: 'unknown-id' | 'wrong-passcode' | 'empty' };

interface UserState {
  users: StoredUser[];
  hydrated: boolean;
  /** Load accounts from device storage, seeding the test user on first run. */
  hydrate: () => Promise<void>;
  /** Check an ID + passcode against the stored accounts. */
  verify: (id: string, passcode: string) => VerifyResult;
  /** Create a new account (or update an existing one with the same id). */
  upsertUser: (user: StoredUser) => Promise<void>;
}

async function persist(users: StoredUser[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to persist VIPER users:', error);
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [SEED_USER],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(isStoredUser)) {
          set({ users: parsed, hydrated: true });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load VIPER users:', error);
    }
    // First run (or read failure): seed the test account and persist it.
    await persist([SEED_USER]);
    set({ users: [SEED_USER], hydrated: true });
  },

  verify: (rawId, passcode) => {
    const id = rawId.trim().toLowerCase();
    if (!id || !passcode) return { ok: false, reason: 'empty' };
    const user = get().users.find((u) => u.id === id);
    if (!user) return { ok: false, reason: 'unknown-id' };
    if (user.passcode !== passcode) return { ok: false, reason: 'wrong-passcode' };
    return { ok: true, user };
  },

  upsertUser: async (user) => {
    const normalized: StoredUser = { ...user, id: user.id.trim().toLowerCase() };
    const next = [...get().users.filter((u) => u.id !== normalized.id), normalized];
    set({ users: next });
    await persist(next);
  },
}));
