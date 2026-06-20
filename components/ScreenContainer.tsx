import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

interface ScreenContainerProps {
  children: ReactNode;
  className?: string;
  /** Safe-area edges to apply. Defaults to top + bottom. */
  edges?: readonly Edge[];
}

/** Full-bleed screen wrapper with the VIPER space-navy background + safe area. */
export function ScreenContainer({
  children,
  className,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  const [background] = useThemeColor(['background']);

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        <View className={cn('flex-1', className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
