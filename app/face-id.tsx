import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
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
import { useBiometricAuth } from '@/lib/useBiometricAuth';

const AnimatedView = createAnimatedComponent(View);
const FRAME = 240;
const SCAN_DURATION = 2200;
const CORNER = 28;

type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';
type ScreenState = 'scanning' | 'success' | 'failed' | 'unavailable';

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

const COPY: Record<ScreenState, { title: string; subtitle: string; subtitleClass: string }> = {
  scanning: {
    title: 'Align your face\nwithin the frame',
    subtitle: 'Scanning...',
    subtitleClass: 'accent',
  },
  success: {
    title: 'Identity verified',
    subtitle: 'Signing you in...',
    subtitleClass: 'success',
  },
  failed: {
    title: "Couldn't verify\nyour identity",
    subtitle: 'Tap to try again',
    subtitleClass: 'danger',
  },
  unavailable: {
    title: 'Biometrics unavailable\non this device',
    subtitle: 'Use your ID & passcode instead',
    subtitleClass: 'muted',
  },
};

export default function FaceRecognitionScreen() {
  const [accent, mutedColor] = useThemeColor(['accent', 'muted']);
  const signIn = useAuthStore((s) => s.signIn);
  const { support, label, authenticate } = useBiometricAuth();

  const [state, setState] = useState<ScreenState>('scanning');
  const promptedRef = useRef(false);

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

  const runAuth = useCallback(async () => {
    setState('scanning');
    const result = await authenticate();

    if (result.status === 'success') {
      signIn('face-id');
      setState('success');
      setTimeout(() => router.replace('/(tabs)'), 700);
      return;
    }
    if (result.status === 'unavailable') {
      setState('unavailable');
      return;
    }
    if (result.status === 'cancelled') {
      router.back();
      return;
    }
    setState('failed');
  }, [authenticate, signIn]);

  // Kick off the native biometric prompt once support is determined.
  useEffect(() => {
    if (support === 'checking' || promptedRef.current) return;
    promptedRef.current = true;
    if (support === 'unavailable') {
      setState('unavailable');
      return;
    }
    void runAuth();
  }, [support, runAuth]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scan.value * (FRAME - CORNER * 2) + CORNER }],
    opacity: 0.6 + scan.value * 0.4,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.03 }],
  }));

  const copy = COPY[state];
  const subtitleColor =
    copy.subtitleClass === 'accent'
      ? accent
      : copy.subtitleClass === 'success'
        ? TINT_HEX['text-success']
        : copy.subtitleClass === 'danger'
          ? TINT_HEX['text-danger']
          : mutedColor;
  const frameColor = state === 'failed' ? TINT_HEX['text-danger'] : accent;
  const interactive = state === 'failed' || state === 'unavailable';

  const handlePress = () => {
    if (state === 'unavailable') {
      router.replace('/');
      return;
    }
    if (state === 'failed') void runAuth();
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader title="Face Recognition" />

      <View className="flex-1 items-center px-6">
        <View className="flex-1 items-center justify-center">
          <Pressable
            disabled={!interactive}
            onPress={handlePress}
            style={({ pressed }) => ({ opacity: pressed && interactive ? 0.7 : 1 })}
          >
            <View style={{ width: FRAME, height: FRAME }} className="items-center justify-center">
              <Corner position="tl" color={frameColor} />
              <Corner position="tr" color={TINT_HEX['text-viper-violet']} />
              <Corner position="bl" color={TINT_HEX['text-viper-violet']} />
              <Corner position="br" color={frameColor} />

              <AnimatedView style={faceStyle}>
                <ScanFace
                  color={state === 'success' ? TINT_HEX['text-success'] : frameColor}
                  size={150}
                  strokeWidth={1.2}
                />
              </AnimatedView>

              {state === 'scanning' ? (
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
              ) : null}
            </View>
          </Pressable>

          <Text className="text-foreground mt-10 text-center text-lg font-semibold">
            {copy.title}
          </Text>
          <Text style={{ color: subtitleColor }} className="mt-3 text-sm font-medium">
            {state === 'scanning' && support === 'available'
              ? `Verifying with ${label}...`
              : copy.subtitle}
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
              Verification happens on-device. Your facial data never leaves your phone.
            </Text>
          </View>
        </Surface>
      </View>
    </ScreenContainer>
  );
}
