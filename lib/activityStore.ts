import { create } from 'zustand';
import type { ActivityEntry, ActivityKind, DailyStats } from './types';

/** Estimated minutes saved each time the assistant handles a command for you. */
const MINUTES_SAVED_PER_COMMAND = 2;

interface ActivityState {
  activity: ActivityEntry[];
  stats: DailyStats;
  logCommand: (title: string, kind: ActivityKind) => void;
}

let counter = 0;

const initialStats: DailyStats = {
  tasks: 0,
  timeSavedMinutes: 0,
  commands: 0,
};

export const useActivityStore = create<ActivityState>((set) => ({
  activity: [],
  stats: initialStats,
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
          timeSavedMinutes: state.stats.timeSavedMinutes + MINUTES_SAVED_PER_COMMAND,
        },
      };
    }),
}));
