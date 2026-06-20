import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricSupport = 'checking' | 'available' | 'unavailable';

export type AuthResult =
  | { status: 'success' }
  | { status: 'failed' }
  | { status: 'cancelled' }
  | { status: 'unavailable' };

interface BiometricAuth {
  /** Whether the device can perform biometric auth. */
  support: BiometricSupport;
  /** Human label for the available biometric type (e.g. "Face ID"). */
  label: string;
  /** Trigger the native biometric prompt. */
  authenticate: () => Promise<AuthResult>;
}

/**
 * Wraps expo-local-authentication. On platforms without biometric hardware
 * (e.g. web preview), reports `unavailable` so callers can fall back gracefully.
 */
export function useBiometricAuth(): BiometricAuth {
  const [support, setSupport] = useState<BiometricSupport>('checking');
  const [label, setLabel] = useState('Biometrics');

  useEffect(() => {
    let active = true;

    const check = async () => {
      if (Platform.OS === 'web') {
        if (active) setSupport('unavailable');
        return;
      }
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (!active) return;

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setLabel(Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setLabel(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setLabel('Iris Scan');
        }

        setSupport(hasHardware && isEnrolled ? 'available' : 'unavailable');
      } catch {
        if (active) setSupport('unavailable');
      }
    };

    void check();
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (Platform.OS === 'web') return { status: 'unavailable' };
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to VIPER',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) return { status: 'success' };
      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        return { status: 'cancelled' };
      }
      return { status: 'failed' };
    } catch {
      return { status: 'unavailable' };
    }
  }, []);

  return { support, label, authenticate };
}
