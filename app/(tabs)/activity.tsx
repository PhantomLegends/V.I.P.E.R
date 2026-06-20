import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Filter } from 'lucide-react-native';
import { Chip, Surface, Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { activityVisuals, TINT_HEX } from '@/lib/assistantData';
import { useActivityStore } from '@/lib/activityStore';
import { timeAgo } from '@/lib/time';
import type { ActivityEntry, ActivityKind } from '@/lib/types';

const FILTERS: { id: 'all' | ActivityKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Email' },
  { id: 'video', label: 'Video' },
  { id: 'app', label: 'Apps' },
  { id: 'study', label: 'Study' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'social', label: 'Social' },
  { id: 'notes', label: 'Notes' },
  { id: 'reminder', label: 'Reminders' },
  { id: 'news', label: 'News' },
];

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const visual = activityVisuals[entry.kind];
  const Icon = visual.icon;
  const tint = TINT_HEX[visual.tintClass] ?? '#5b8def';

  return (
    <Surface
      variant="secondary"
      className="border-border/60 mb-3 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
    >
      <View
        style={{ backgroundColor: `${tint}22` }}
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        <Icon color={tint} size={20} />
      </View>
      <Text className="text-foreground flex-1 text-sm font-medium">{entry.title}</Text>
      <Text className="text-muted text-xs">{timeAgo(entry.timestamp)}</Text>
    </Surface>
  );
}

export default function ActivityScreen() {
  const [foreground] = useThemeColor(['foreground']);
  const activity = useActivityStore((s) => s.activity);
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? activity : activity.filter((a) => a.kind === filter)),
    [activity, filter],
  );

  return (
    <ScreenContainer edges={['top']}>
      <ScreenHeader
        title="Recent Activity"
        onBack={() => router.replace('/(tabs)')}
        right={
          <Pressable hitSlop={8}>
            <Filter color={foreground} size={20} />
          </Pressable>
        }
      />

      <View className="px-5">
        <View className="flex-row flex-wrap gap-2 pb-3">
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)}>
              <Chip
                className={
                  filter === f.id ? 'border-accent bg-accent/20 border' : 'border-border/40 border'
                }
              >
                <Chip.Label>{f.label}</Chip.Label>
              </Chip>
            </Pressable>
          ))}
        </View>
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow entry={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="text-muted mt-12 text-center text-sm">
            No activity in this category yet.
          </Text>
        }
      />
    </ScreenContainer>
  );
}
