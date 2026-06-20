import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  Mail,
  MessageCircle,
  Mic,
  Newspaper,
  ScanFace,
  ScreenShare,
  Smartphone,
  StickyNote,
  Target,
  Volume2,
  Youtube,
} from 'lucide-react-native';
import type { ActivityKind, QuickAction, Suggestion } from './types';

export const quickActions: QuickAction[] = [
  {
    id: 'open-gmail',
    label: 'Open\nGmail',
    icon: Mail,
    kind: 'email',
    tintClass: 'text-danger',
    spokenResponse: 'Opening Gmail for you.',
  },
  {
    id: 'study-mode',
    label: 'Study\nMode',
    icon: BookOpen,
    kind: 'study',
    tintClass: 'text-viper-blue',
    spokenResponse: 'Study Mode activated. Notifications are now silenced.',
  },
  {
    id: 'read-screen',
    label: 'Read\nScreen',
    icon: ScreenShare,
    kind: 'tts',
    tintClass: 'text-viper-cyan',
    spokenResponse: 'Reading the screen aloud.',
  },
  {
    id: 'take-notes',
    label: 'Take\nNotes',
    icon: StickyNote,
    kind: 'notes',
    tintClass: 'text-viper-cyan',
    spokenResponse: 'Ready to take notes. Go ahead.',
  },
  {
    id: 'set-reminder',
    label: 'Set\nReminder',
    icon: Bell,
    kind: 'reminder',
    tintClass: 'text-viper-violet',
    spokenResponse: 'What would you like me to remind you about?',
  },
  {
    id: 'focus-mode',
    label: 'Focus\nMode',
    icon: Target,
    kind: 'focus',
    tintClass: 'text-viper-violet',
    spokenResponse: 'Focus Mode on. Stay in the zone.',
  },
  {
    id: 'work-mode',
    label: 'Work\nMode',
    icon: Briefcase,
    kind: 'focus',
    tintClass: 'text-viper-blue',
    spokenResponse: 'Work Mode enabled. Productivity apps are ready.',
  },
  {
    id: 'open-youtube',
    label: 'Open\nYouTube',
    icon: Youtube,
    kind: 'video',
    tintClass: 'text-danger',
    spokenResponse: 'Opening YouTube.',
  },
];

export const suggestions: Suggestion[] = [
  { id: 's1', text: 'Open YouTube', icon: Youtube },
  { id: 's2', text: 'Read my emails', icon: Mail },
  { id: 's3', text: "What's on my schedule?", icon: Calendar },
  { id: 's4', text: 'Start Focus Mode', icon: Target },
];

/** Icon + tint for each activity kind. */
export const activityVisuals: Record<ActivityKind, { icon: typeof Mail; tintClass: string }> = {
  email: { icon: Mail, tintClass: 'text-danger' },
  video: { icon: Youtube, tintClass: 'text-danger' },
  app: { icon: Smartphone, tintClass: 'text-viper-blue' },
  study: { icon: BookOpen, tintClass: 'text-viper-blue' },
  calendar: { icon: Calendar, tintClass: 'text-viper-cyan' },
  social: { icon: MessageCircle, tintClass: 'text-viper-violet' },
  notes: { icon: StickyNote, tintClass: 'text-warning' },
  news: { icon: Newspaper, tintClass: 'text-viper-cyan' },
  reminder: { icon: Bell, tintClass: 'text-viper-violet' },
  focus: { icon: Target, tintClass: 'text-viper-violet' },
  tts: { icon: Volume2, tintClass: 'text-viper-cyan' },
};

/**
 * Classify a free-form command (typed, spoken, or a suggestion) into the most
 * fitting activity kind so the activity feed shows the right icon. Order matters:
 * the most specific keywords are checked first.
 */
export function classifyCommand(text: string): ActivityKind {
  const t = text.toLowerCase();

  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has('gmail', 'email', 'inbox', 'mail')) return 'email';
  if (has('youtube', 'video', 'watch', 'play ')) return 'video';
  if (has('remind', 'reminder', 'alarm', 'timer', 'wake me')) return 'reminder';
  if (has('schedule', 'calendar', 'meeting', 'appointment', 'event', 'agenda')) return 'calendar';
  if (has('note', 'write down', 'jot', 'memo')) return 'notes';
  if (has('news', 'headline', 'article', 'briefing')) return 'news';
  if (has('study', 'learn', 'homework', 'revise', 'flashcard')) return 'study';
  if (has('focus', 'work mode', 'concentrate', 'deep work')) return 'focus';
  if (has('read', 'speak', 'say ', 'text-to-speech', 'tts', 'aloud')) return 'tts';
  if (
    has(
      'message',
      'text ',
      'whatsapp',
      'chat',
      'call',
      'instagram',
      'twitter',
      'tweet',
      'snapchat',
      'social',
    )
  ) {
    return 'social';
  }

  return 'app';
}

/** Hex equivalents of the accent tint classes, for icon `color` props. */
export const TINT_HEX: Record<string, string> = {
  'text-viper-blue': '#5b8def',
  'text-viper-violet': '#a07cf0',
  'text-viper-cyan': '#5fc8e8',
  'text-danger': '#e0533d',
  'text-warning': '#e0a13d',
  'text-success': '#3dd68c',
};

export const featureHighlights = [
  {
    id: 'voice',
    title: 'Voice Control',
    description: 'Control everything with your voice.',
    icon: Mic,
    tintClass: 'text-viper-blue',
  },
  {
    id: 'face',
    title: 'Face Recognition',
    description: 'Secure, fast & contactless access.',
    icon: ScanFace,
    tintClass: 'text-viper-cyan',
  },
  {
    id: 'tts',
    title: 'Text-to-Speech',
    description: 'Listen to anything, anytime.',
    icon: Volume2,
    tintClass: 'text-viper-violet',
  },
  {
    id: 'productivity',
    title: 'Productivity',
    description: 'Automate tasks & get more done.',
    icon: BarChart3,
    tintClass: 'text-success',
  },
];
