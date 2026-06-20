import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mic,
  ScanFace,
  Shield,
  User,
  Volume2,
} from 'lucide-react-native';
import { InputGroup, Separator, Text, useThemeColor } from 'heroui-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { GradientButton } from '@/components/GradientButton';
import { Gradient } from '@/components/Gradient';
import { useAuthStore } from '@/lib/authStore';
import { useUserStore } from '@/lib/userStore';

const statusItems = [
  { icon: Mic, label: 'Voice\nReady', tint: 'text-viper-blue' },
  { icon: ScanFace, label: 'Face\nVerified', tint: 'text-viper-cyan' },
  { icon: Volume2, label: 'TTS\nEnabled', tint: 'text-viper-violet' },
] as const;

export default function SignInScreen() {
  const [muted, accent, fieldPlaceholder] = useThemeColor(['muted', 'accent', 'muted']);
  const [id, setId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useAuthStore((s) => s.signIn);
  const verify = useUserStore((s) => s.verify);

  const handleCredentialsSignIn = () => {
    const result = verify(id, passcode);
    if (!result.ok) {
      const message =
        result.reason === 'empty'
          ? 'Enter your ID and passcode.'
          : result.reason === 'unknown-id'
            ? 'No account found with that ID.'
            : 'Incorrect passcode. Try again.';
      setError(message);
      return;
    }
    setError(null);
    signIn('credentials', result.user.name);
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View className="items-center pt-8">
            <View className="h-20 w-20 items-center justify-center">
              <ChevronDown color={accent} size={44} strokeWidth={2.5} />
            </View>
            <Text className="text-foreground mt-3 text-3xl font-bold tracking-[8px]">
              V.I.P.E.R
            </Text>
            <Text className="text-muted mt-2 text-center text-xs leading-5">
              Virtual Intelligent Protocol{'\n'}for Execution & Response
            </Text>
          </View>

          {/* Welcome */}
          <View className="mt-8 items-center">
            <Text className="text-foreground text-2xl font-bold">Welcome back!</Text>
            <Text className="text-muted mt-1 text-sm">
              Your intelligent accessibility assistant.
            </Text>
          </View>

          {/* Form */}
          <View className="mt-8 gap-4">
            <InputGroup>
              <InputGroup.Prefix isDecorative>
                <User color={muted} size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={id}
                onChangeText={(t) => {
                  setId(t);
                  if (error) setError(null);
                }}
                placeholder="Enter ID"
                placeholderTextColor={fieldPlaceholder}
                autoCapitalize="none"
              />
            </InputGroup>

            <InputGroup>
              <InputGroup.Prefix isDecorative>
                <Lock color={muted} size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={passcode}
                onChangeText={(t) => {
                  setPasscode(t);
                  if (error) setError(null);
                }}
                placeholder="Enter Passcode"
                placeholderTextColor={fieldPlaceholder}
                secureTextEntry={!showPasscode}
              />
              <InputGroup.Suffix>
                <Pressable onPress={() => setShowPasscode((v) => !v)} hitSlop={12}>
                  {showPasscode ? (
                    <EyeOff color={muted} size={18} />
                  ) : (
                    <Eye color={muted} size={18} />
                  )}
                </Pressable>
              </InputGroup.Suffix>
            </InputGroup>

            <GradientButton
              label="SIGN IN"
              onPress={handleCredentialsSignIn}
              className="mt-1"
              icon={<ArrowRight color="#ffffff" size={20} />}
            />

            {error ? (
              <Text style={{ color: '#e0533d' }} className="text-center text-xs font-medium">
                {error}
              </Text>
            ) : null}
          </View>

          {/* Divider */}
          <View className="my-6 flex-row items-center gap-4">
            <Separator className="flex-1" />
            <Text className="text-muted text-xs">OR</Text>
            <Separator className="flex-1" />
          </View>

          {/* Face ID */}
          <Pressable
            onPress={() => router.push('/face-id')}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            className="border-accent flex-row items-center justify-center gap-3 rounded-2xl border py-4"
          >
            <ScanFace color={accent} size={20} />
            <Text className="text-foreground text-base font-semibold tracking-wider">
              FACE ID SIGN IN
            </Text>
          </Pressable>

          {/* Status row */}
          <View className="mt-8 flex-row justify-center gap-10">
            {statusItems.map(({ icon: Icon, label, tint }) => (
              <View key={label} className="items-center gap-2">
                <Icon color={tint === 'text-viper-cyan' ? '#5fc8e8' : accent} size={22} />
                <Text className="text-muted text-center text-xs leading-4">{label}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View className="mt-10 flex-row items-center justify-center gap-2">
            <Shield color={muted} size={14} />
            <Text className="text-muted text-xs">Secure • Private • Always with you</Text>
          </View>

          <View className="grow" />
          {/* Subtle ambient glow at bottom */}
          <Gradient
            colors={['transparent', 'rgba(99,102,241,0.06)']}
            pointerEvents="none"
            className="h-px"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
