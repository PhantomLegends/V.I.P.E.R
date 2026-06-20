import { create } from 'zustand';
import type { ActivityEntry, ActivityKind, DailyStats } from './types';

const now = Date.now();
const MIN = 60_000;

const seedActivity: ActivityEntry[] = [
  { id: 'a1', title: 'Opened Gmail', kind: 'app', timestamp: now - 2 * MIN },
  { id: 'a2', title: 'Started Study Mode', kind: 'study', timestamp: now - 15 * MIN },
  { id: 'a3', title: 'Read Calendar Events', kind: 'calendar', timestamp: now - 32 * MIN },
  { id: 'a4', title: 'Opened Discord', kind: 'social', timestamp: now - 45 * MIN },
  { id: 'a5', title: 'Took Notes', kind: 'notes', timestamp: now - 60 * MIN },
  { id: 'a6', title: 'Read News Articles', kind: 'news', timestamp: now - 90 * MIN },
];

interface ActivityState {
  activity: ActivityEntry[];
  stats: DailyStats;
  logCommand: (title: string, kind: ActivityKind) => void;
}

let counter = 0;

export const useActivityStore = create<ActivityState>((set) => ({
  activity: seedActivity,
  stats: {
    tasks: 4,
    tasksDelta: 25,
    timeSavedMinutes: 135,
    timeSavedDelta: 18,
    commands: 28,
    commandsDelta: 15,
  },
  logCommand: (title, kind) =>
    set((state) => {
      counter += 1;
      const entry: ActivityEntry = {
        id: `cmd-${Date.now()}-${counter}`,
        title,
        kind,
        timestamp: Date.now(),
      };
      return {
        activity: [entry, ...state.activity],
        stats: {
          ...state.stats,
          commands: state.stats.commands + 1,
          tasks: state.stats.tasks + 1,
        },
      };
    }),
}));
