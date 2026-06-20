import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  Mail,
  MessageCircle,
  Mic,
  Newspaper,
  ScanFace,
  ScreenShare,
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
    tintClass: 'text-danger',
    spokenResponse: 'Opening Gmail for you.',
  },
  {
    id: 'study-mode',
    label: 'Study\nMode',
    icon: BookOpen,
    tintClass: 'text-viper-blue',
    spokenResponse: 'Study Mode activated. Notifications are now silenced.',
  },
  {
    id: 'read-screen',
    label: 'Read\nScreen',
    icon: ScreenShare,
    tintClass: 'text-viper-cyan',
    spokenResponse: 'Reading the screen aloud.',
  },
  {
    id: 'take-notes',
    label: 'Take\nNotes',
    icon: StickyNote,
    tintClass: 'text-viper-cyan',
    spokenResponse: 'Ready to take notes. Go ahead.',
  },
  {
    id: 'set-reminder',
    label: 'Set\nReminder',
    icon: Bell,
    tintClass: 'text-viper-violet',
    spokenResponse: 'What would you like me to remind you about?',
  },
  {
    id: 'focus-mode',
    label: 'Focus\nMode',
    icon: Target,
    tintClass: 'text-viper-violet',
    spokenResponse: 'Focus Mode on. Stay in the zone.',
  },
  {
    id: 'work-mode',
    label: 'Work\nMode',
    icon: Briefcase,
    tintClass: 'text-viper-blue',
    spokenResponse: 'Work Mode enabled. Productivity apps are ready.',
  },
  {
    id: 'open-youtube',
    label: 'Open\nYouTube',
    icon: Youtube,
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
  app: { icon: Mail, tintClass: 'text-danger' },
  study: { icon: BookOpen, tintClass: 'text-viper-blue' },
  calendar: { icon: Calendar, tintClass: 'text-viper-cyan' },
  social: { icon: MessageCircle, tintClass: 'text-viper-violet' },
  notes: { icon: FileText, tintClass: 'text-warning' },
  news: { icon: Newspaper, tintClass: 'text-viper-cyan' },
  reminder: { icon: Bell, tintClass: 'text-viper-violet' },
  focus: { icon: Target, tintClass: 'text-viper-violet' },
  tts: { icon: Volume2, tintClass: 'text-viper-cyan' },
};

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
