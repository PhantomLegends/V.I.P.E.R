import type { LucideIcon } from 'lucide-react-native';

/** A quick-action shortcut shown on the home grid. */
export type QuickActionId =
  | 'open-gmail'
  | 'study-mode'
  | 'read-screen'
  | 'take-notes'
  | 'set-reminder'
  | 'focus-mode'
  | 'work-mode'
  | 'open-youtube';

export interface QuickAction {
  id: QuickActionId;
  label: string;
  icon: LucideIcon;
  /** Tailwind accent class for the icon tint, mapped via accent-* utilities. */
  tintClass: string;
  spokenResponse: string;
}

/** Source/category for an executed command, used to pick an icon + color. */
export type ActivityKind =
  | 'app'
  | 'study'
  | 'calendar'
  | 'social'
  | 'notes'
  | 'news'
  | 'reminder'
  | 'focus'
  | 'tts';

export interface ActivityEntry {
  id: string;
  title: string;
  kind: ActivityKind;
  /** Epoch ms when the command ran. */
  timestamp: number;
}

export interface Suggestion {
  id: string;
  text: string;
  icon: LucideIcon;
}

export interface DailyStats {
  tasks: number;
  tasksDelta: number;
  timeSavedMinutes: number;
  timeSavedDelta: number;
  commands: number;
  commandsDelta: number;
}

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';
