import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AlertCircle, ChevronRight, Settings } from 'lucide-react-native';
import { Surface, Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { VoiceOrb } from '@/components/VoiceOrb';
import { suggestions, TINT_HEX } from '@/lib/assistantData';
import { useActivityStore } from '@/lib/activityStore';
import { useVoiceRecognition } from '@/lib/useVoiceRecognition';
import type { AssistantState, Suggestion } from '@/lib/types';

const STATE_LABEL: Record<AssistantState, string> = {
  idle: 'Tap to speak',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
};

function ListeningDots({ active }: { active: boolean }) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const dots = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'];
  return (
    <View className="mt-3 flex-row items-center gap-1.5">
      {dots.map((id, i) => (
        <View
          key={id}
          style={{ backgroundColor: active && i < 4 ? accent : muted }}
          className="h-1.5 w-1.5 rounded-full"
        />
      ))}
    </View>
  );
}

function SuggestionRow({ item }: { item: Suggestion }) {
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);
  const logCommand = useActivityStore((s) => s.logCommand);
  const Icon = item.icon;

  return (
    <Pressable
      onPress={() => logCommand(item.text, 'app')}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Surface
        variant="secondary"
        className="border-border/60 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
      >
        <Icon color={foreground} size={18} />
        <Text className="text-foreground flex-1 text-sm">{item.text}</Text>
        <ChevronRight color={muted} size={18} />
      </Surface>
    </Pressable>
  );
}

export default function AssistantScreen() {
  const [foreground] = useThemeColor(['foreground']);
  const logCommand = useActivityStore((s) => s.logCommand);

  const onFinalResult = useCallback(
    (text: string) => {
      logCommand(text, 'app');
    },
    [logCommand],
  );

  const { state, transcript, error, toggle } = useVoiceRecognition(onFinalResult);

  return (
    <ScreenContainer edges={['top']}>
      <ScreenHeader
        title="Voice Assistant"
        onBack={() => router.replace('/(tabs)')}
        right={
          <Pressable hitSlop={8}>
            <Settings color={foreground} size={20} />
          </Pressable>
        }
      />

      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-10">
          <VoiceOrb state={state} onPress={toggle} size={104} />
          <Text className="text-foreground mt-4 text-xl font-semibold">{STATE_LABEL[state]}</Text>
          <ListeningDots active={state === 'listening'} />
          {transcript.length > 0 ? (
            <Text className="text-foreground mt-4 px-6 text-center text-base">
              &ldquo;{transcript}&rdquo;
            </Text>
          ) : null}
          {error ? (
            <View className="border-danger/40 bg-danger/10 mt-4 flex-row items-center gap-2 rounded-2xl border px-4 py-2.5">
              <AlertCircle color={TINT_HEX['text-danger']} size={16} />
              <Text className="text-danger flex-1 text-sm">{error}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-muted mt-10 text-sm font-medium">You can try saying:</Text>
        <View className="mt-3 gap-3">
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} item={s} />
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/face-id')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          className="mt-6"
        >
          <Text
            style={{ color: TINT_HEX['text-viper-cyan'] }}
            className="text-center text-sm font-medium"
          >
            Use Face Recognition instead
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
