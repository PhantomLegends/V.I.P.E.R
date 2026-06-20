import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Bell, Menu } from 'lucide-react-native';
import { Surface, Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { VoiceOrb } from '@/components/VoiceOrb';
import { Waveform } from '@/components/Waveform';
import { StatCard } from '@/components/StatCard';
import { quickActions, TINT_HEX } from '@/lib/assistantData';
import { useAuthStore } from '@/lib/authStore';
import { useActivityStore } from '@/lib/activityStore';
import { formatDuration } from '@/lib/time';
import type { AssistantState, QuickAction } from '@/lib/types';

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  const logCommand = useActivityStore((s) => s.logCommand);

  return (
    <Pressable
      onPress={() => logCommand(action.label.replace('\n', ' '), action.kind)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className="flex-1"
    >
      <Surface
        variant="secondary"
        className="border-border/60 items-center gap-2 rounded-2xl border py-4"
      >
        <Icon color={TINT_HEX[action.tintClass] ?? '#5b8def'} size={26} />
        <Text className="text-foreground text-center text-xs leading-4 font-medium">
          {action.label}
        </Text>
      </Surface>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [foreground, accent] = useThemeColor(['foreground', 'accent']);
  const userName = useAuthStore((s) => s.userName);
  const stats = useActivityStore((s) => s.stats);
  const [voiceState, setVoiceState] = useState<AssistantState>('idle');

  const homeActions = quickActions.slice(0, 6);

  const handleOrbPress = () => {
    setVoiceState('listening');
    router.push('/(tabs)/assistant');
    setTimeout(() => setVoiceState('idle'), 400);
  };

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between pt-2">
          <Pressable hitSlop={10}>
            <Menu color={foreground} size={26} />
          </Pressable>
          <Pressable hitSlop={10} className="relative">
            <Bell color={foreground} size={24} />
            <View
              style={{ backgroundColor: accent }}
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
            />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text className="text-foreground mt-4 text-2xl font-bold">Good Morning, {userName} 👋</Text>
        <Text className="text-muted mt-1 text-sm">Ready to assist you today.</Text>

        {/* Tap to speak panel */}
        <Surface
          variant="secondary"
          className="border-border/60 mt-5 items-center rounded-3xl border py-6"
        >
          <View className="h-24 flex-row items-center justify-center gap-4">
            <View className="flex-1 items-end overflow-hidden">
              <Waveform active={voiceState === 'listening'} />
            </View>
            <VoiceOrb state={voiceState} onPress={handleOrbPress} size={72} />
            <View className="flex-1 items-start overflow-hidden">
              <Waveform active={voiceState === 'listening'} mirrored />
            </View>
          </View>
          <Text className="text-foreground mt-2 text-base font-semibold">Tap to speak</Text>
          <Text className="text-muted text-xs">or say “Hey VIPER”</Text>
        </Surface>

        {/* Quick actions */}
        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-semibold">Quick Actions</Text>
          <Pressable onPress={() => router.push('/(tabs)/assistant')}>
            <Text style={{ color: accent }} className="text-sm font-medium">
              View All
            </Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-3">
          <View className="flex-row gap-3">
            {homeActions.slice(0, 3).map((a) => (
              <QuickActionCard key={a.id} action={a} />
            ))}
          </View>
          <View className="flex-row gap-3">
            {homeActions.slice(3, 6).map((a) => (
              <QuickActionCard key={a.id} action={a} />
            ))}
          </View>
        </View>

        {/* Today's progress */}
        <Surface variant="secondary" className="border-border/60 mt-6 rounded-3xl border p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground text-lg font-semibold">Today&apos;s Progress</Text>
            <Pressable onPress={() => router.push('/(tabs)/activity')}>
              <Text style={{ color: accent }} className="text-sm font-medium">
                View Report
              </Text>
            </Pressable>
          </View>
          <View className="mt-4 flex-row">
            <StatCard label="Tasks" value={String(stats.tasks)} delta={stats.tasksDelta} />
            <StatCard
              label="Time Saved"
              value={formatDuration(stats.timeSavedMinutes)}
              delta={stats.timeSavedDelta}
            />
            <StatCard label="Commands" value={String(stats.commands)} delta={stats.commandsDelta} />
          </View>
        </Surface>

        <Text className="text-muted mt-6 text-center text-xs">
          VIPER • Always listening, always helping
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
