import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  /** Optional node rendered on the right (e.g. a settings icon button). */
  right?: ReactNode;
  onBack?: () => void;
}

/** Compact sub-screen header: back chevron, centered title, optional right slot. */
export function ScreenHeader({ title, right, onBack }: ScreenHeaderProps) {
  const [foreground] = useThemeColor(['foreground']);

  return (
    <View className="h-12 flex-row items-center justify-between px-4">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={10}
        className="h-9 w-9 items-center justify-center"
      >
        <ChevronLeft color={foreground} size={26} />
      </Pressable>
      <Text className="text-foreground text-base font-semibold">{title}</Text>
      <View className="h-9 w-9 items-center justify-center">{right}</View>
    </View>
  );
}
