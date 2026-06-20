import { useEffect } from 'react';
import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';
import {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = createAnimatedComponent(View);

// Static heights give the waveform an organic, non-uniform shape.
const BARS = [8, 16, 28, 18, 36, 22, 44, 26, 14, 30, 20, 38, 24, 12, 18, 10].map(
  (height, index) => ({ id: `bar-${index}-${height}`, height, index }),
);

function Bar({
  baseHeight,
  index,
  active,
  color,
}: {
  baseHeight: number;
  index: number;
  active: boolean;
  color: string;
}) {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      scale.value = withDelay(
        index * 70,
        withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.ease) }), -1, true),
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(0.5, { duration: 300 });
    }
    return () => cancelAnimation(scale);
  }, [active, index, scale]);

  const style = useAnimatedStyle(() => ({
    height: baseHeight * (0.4 + scale.value * 0.6),
  }));

  return <AnimatedView style={[{ width: 3, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** Decorative audio waveform shown beside the home tap-to-speak orb. */
export function Waveform({
  active = false,
  mirrored = false,
}: {
  active?: boolean;
  mirrored?: boolean;
}) {
  const [accent] = useThemeColor(['accent']);
  const bars = mirrored ? [...BARS].toReversed() : BARS;

  return (
    <View className="h-12 flex-row items-center gap-1">
      {bars.map((bar) => (
        <Bar
          key={bar.id}
          baseHeight={bar.height}
          index={bar.index}
          active={active}
          color={accent}
        />
      ))}
    </View>
  );
}
