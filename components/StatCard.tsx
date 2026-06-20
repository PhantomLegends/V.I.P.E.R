import { View } from 'react-native';
import { Text } from 'heroui-native';

interface StatCardProps {
  label: string;
  value: string;
  /** Percentage delta, e.g. 25 renders as "+25%". */
  delta?: number;
}

/** Single stat column for the Today's Progress panel. */
export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="text-muted text-xs">{label}</Text>
      <Text className="text-foreground text-xl font-bold">{value}</Text>
      {delta !== undefined ? (
        <Text className="text-success text-xs font-medium">
          {delta >= 0 ? '+' : ''}
          {delta}%
        </Text>
      ) : null}
    </View>
  );
}
