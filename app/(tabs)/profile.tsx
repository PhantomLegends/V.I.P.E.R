import { Pressable, ScrollView, View } from 'react-native';
import {
  BarChart3,
  ChevronRight,
  LogOut,
  Mic,
  ScanFace,
  ShieldCheck,
  Volume2,
} from 'lucide-react-native';
import { Avatar, Surface, Switch, Text } from 'heroui-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatCard } from '@/components/StatCard';
import { TINT_HEX } from '@/lib/assistantData';
import { useAuthStore } from '@/lib/authStore';
import { useActivityStore } from '@/lib/activityStore';
import { formatDuration } from '@/lib/time';
import { useSettingsStore } from '@/lib/settingsStore';
import type { LucideIcon } from 'lucide-react-native';

interface ToggleRow {
  id: 'voice' | 'faceId' | 'tts';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tint: string;
}

const TOGGLES: ToggleRow[] = [
  {
    id: 'voice',
    title: 'Voice Control',
    subtitle: 'Wake on “Hey VIPER”',
    icon: Mic,
    tint: TINT_HEX['text-viper-blue'],
  },
  {
    id: 'faceId',
    title: 'Face ID Sign-In',
    subtitle: 'Contactless biometric access',
    icon: ScanFace,
    tint: TINT_HEX['text-viper-cyan'],
  },
  {
    id: 'tts',
    title: 'Text-to-Speech',
    subtitle: 'Spoken assistant replies',
    icon: Volume2,
    tint: TINT_HEX['text-viper-violet'],
  },
];

export default function ProfileScreen() {
  const userName = useAuthStore((s) => s.userName);
  const authMethod = useAuthStore((s) => s.authMethod);
  const signOut = useAuthStore((s) => s.signOut);
  const stats = useActivityStore((s) => s.stats);
  const settings = useSettingsStore();

  const handleSignOut = () => {
    signOut();
    // Land directly on the ID/passcode login screen (app/index.tsx). Replace the
    // whole stack so the tabs group is fully unmounted with nothing behind it.
    router.replace('/');
    // Drop any remaining screens (e.g. modals/tabs) left in history.
    if (router.canDismiss()) router.dismissAll();
  };

  return (
    <ScreenContainer edges={['top']}>
      <ScreenHeader title="Profile" onBack={() => router.replace('/(tabs)')} />

      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View className="items-center pt-2">
          <Avatar size="lg" alt={userName}>
            <Avatar.Fallback>
              <Text className="text-foreground text-xl font-bold">{userName.charAt(0)}</Text>
            </Avatar.Fallback>
          </Avatar>
          <Text className="text-foreground mt-3 text-xl font-bold">{userName}</Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <ShieldCheck color={TINT_HEX['text-success']} size={14} />
            <Text className="text-muted text-xs">
              {authMethod === 'face-id' ? 'Face ID verified' : 'Securely signed in'}
            </Text>
          </View>
        </View>

        {/* Stats summary */}
        <Surface variant="secondary" className="border-border/60 mt-6 rounded-3xl border p-5">
          <Text className="text-foreground text-sm font-semibold">Your VIPER stats</Text>
          <View className="mt-4 flex-row">
            <StatCard label="Tasks" value={String(stats.tasks)} />
            <StatCard label="Time Saved" value={formatDuration(stats.timeSavedMinutes)} />
            <StatCard label="Commands" value={String(stats.commands)} />
          </View>
        </Surface>

        {/* Feature toggles */}
        <Text className="text-foreground mt-7 text-lg font-semibold">Assistant Settings</Text>
        <View className="mt-3 gap-3">
          {TOGGLES.map((row) => {
            const Icon = row.icon;
            return (
              <Surface
                key={row.id}
                variant="secondary"
                className="border-border/60 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
              >
                <View
                  style={{ backgroundColor: `${row.tint}22` }}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Icon color={row.tint} size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">{row.title}</Text>
                  <Text className="text-muted text-xs">{row.subtitle}</Text>
                </View>
                <Switch
                  isSelected={settings[row.id]}
                  onSelectedChange={() => settings.toggle(row.id)}
                />
              </Surface>
            );
          })}
        </View>

        {/* Productivity link */}
        <Pressable
          onPress={() => router.push('/(tabs)/activity')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          className="mt-3"
        >
          <Surface
            variant="secondary"
            className="border-border/60 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
          >
            <View
              style={{ backgroundColor: `${TINT_HEX['text-success']}22` }}
              className="h-10 w-10 items-center justify-center rounded-xl"
            >
              <BarChart3 color={TINT_HEX['text-success']} size={20} />
            </View>
            <Text className="text-foreground flex-1 text-sm font-medium">Productivity Report</Text>
            <ChevronRight color={TINT_HEX['text-viper-blue']} size={18} />
          </Surface>
        </Pressable>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          className="border-danger/40 mt-7 flex-row items-center justify-center gap-2 rounded-2xl border py-4"
        >
          <LogOut color={TINT_HEX['text-danger']} size={18} />
          <Text style={{ color: TINT_HEX['text-danger'] }} className="text-sm font-semibold">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
