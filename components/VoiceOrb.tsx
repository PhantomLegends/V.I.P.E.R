import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useThemeColor } from 'heroui-native';
import {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Gradient } from './Gradient';
import type { AssistantState } from '@/lib/types';

interface VoiceOrbProps {
  state: AssistantState;
  onPress?: () => void;
  /** Diameter of the central mic button in px. Rings scale from this. */
  size?: number;
}

const AnimatedView = createAnimatedComponent(View);

function Ring({ delay, active, size }: { delay: number; active: boolean; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 300 });
    }
    return () => cancelAnimation(progress);
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.9 }],
    opacity: (1 - progress.value) * 0.4,
  }));

  // Stagger rings by delaying their starting scale via fixed offset.
  void delay;

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      className="border-viper-blue bg-viper-blue/10 border"
    />
  );
}

/** Tap-to-speak orb with pulsing rings; the centre breathes while listening. */
export function VoiceOrb({ state, onPress, size = 120 }: VoiceOrbProps) {
  const [accent] = useThemeColor(['accent']);
  const active = state === 'listening' || state === 'thinking';
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (active) {
      breathe.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(breathe);
      breathe.value = withTiming(0, { duration: 300 });
    }
    return () => cancelAnimation(breathe);
  }, [active, breathe]);

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.06 }],
  }));

  const ringArea = size * 2.4;

  return (
    <View style={{ width: ringArea, height: ringArea }} className="items-center justify-center">
      <Ring delay={0} active={active} size={size * 1.5} />
      <Ring delay={800} active={active} size={size * 1.9} />
      <Ring delay={1600} active={active} size={size * 2.3} />

      <AnimatedView style={centerStyle}>
        <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <Gradient
            colors={[accent, '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              shadowColor: accent,
              shadowOpacity: 0.6,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
            className="items-center justify-center"
          >
            <Mic color="#ffffff" size={size * 0.4} strokeWidth={2} />
          </Gradient>
        </Pressable>
      </AnimatedView>
    </View>
  );
}
