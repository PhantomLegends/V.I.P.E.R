import { useEffect } from 'react';
import { View } from 'react-native';
import { ScanFace, ShieldCheck } from 'lucide-react-native';
import { Surface, Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';
import {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TINT_HEX } from '@/lib/assistantData';
import { useAuthStore } from '@/lib/authStore';

const AnimatedView = createAnimatedComponent(View);
const FRAME = 240;
const SCAN_DURATION = 2200;
const CORNER = 28;

type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';

/** Decorative L-shaped bracket for the scanning frame corners. */
function Corner({ position, color }: { position: CornerPosition; color: string }) {
  const base = 'absolute h-7 w-7';
  const map: Record<CornerPosition, string> = {
    tl: 'left-0 top-0 border-l-2 border-t-2 rounded-tl-lg',
    tr: 'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg',
    bl: 'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg',
    br: 'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg',
  };
  return <View style={{ borderColor: color }} className={`${base} ${map[position]}`} />;
}

export default function FaceRecognitionScreen() {
  const [accent] = useThemeColor(['accent']);
  const signIn = useAuthStore((s) => s.signIn);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const scan = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    scan.value = withRepeat(
      withTiming(1, { duration: SCAN_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(scan);
      cancelAnimation(pulse);
    };
  }, [scan, pulse]);

  // Auto-complete the scan after a short delay, then route into the app.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isAuthenticated) signIn('face-id');
      router.replace('/(tabs)');
    }, 3200);
    return () => clearTimeout(t);
  }, [isAuthenticated, signIn]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scan.value * (FRAME - CORNER * 2) + CORNER }],
    opacity: 0.6 + scan.value * 0.4,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.03 }],
  }));

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader title="Face Recognition" />

      <View className="flex-1 items-center px-6">
        <View className="flex-1 items-center justify-center">
          <View style={{ width: FRAME, height: FRAME }} className="items-center justify-center">
            <Corner position="tl" color={accent} />
            <Corner position="tr" color={TINT_HEX['text-viper-violet']} />
            <Corner position="bl" color={TINT_HEX['text-viper-violet']} />
            <Corner position="br" color={accent} />

            <AnimatedView style={faceStyle}>
              <ScanFace color={accent} size={150} strokeWidth={1.2} />
            </AnimatedView>

            <AnimatedView
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: CORNER,
                  right: CORNER,
                  height: 2,
                  backgroundColor: TINT_HEX['text-viper-cyan'],
                  shadowColor: TINT_HEX['text-viper-cyan'],
                  shadowOpacity: 0.9,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
                scanLineStyle,
              ]}
            />
          </View>

          <Text className="text-foreground mt-10 text-center text-lg font-semibold">
            Align your face{'\n'}within the frame
          </Text>
          <Text style={{ color: accent }} className="mt-3 text-sm font-medium">
            Scanning...
          </Text>
        </View>

        <Surface
          variant="secondary"
          className="border-border/60 mb-2 w-full flex-row items-center gap-3 rounded-2xl border px-4 py-4"
        >
          <ShieldCheck color={TINT_HEX['text-success']} size={22} />
          <View className="flex-1">
            <Text className="text-foreground text-sm font-semibold">Secure &amp; Private</Text>
            <Text className="text-muted text-xs">
              Your facial data is encrypted and never stored.
            </Text>
          </View>
        </Surface>
      </View>
    </ScreenContainer>
  );
}
