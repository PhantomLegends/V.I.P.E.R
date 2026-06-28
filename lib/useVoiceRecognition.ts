import { useCallback, useEffect, useRef, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { AssistantState } from './types';

/**
 * Expo Go ships a fixed set of native modules and cannot load custom ones like
 * expo-speech-recognition. Detecting it lets the UI explain that on-device voice
 * needs a dev/TestFlight build instead of surfacing a confusing failure.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const UNAVAILABLE_MESSAGE = isExpoGo
  ? 'On-device voice needs a dev or TestFlight build — Expo Go can\u2019t load it. Type a command below instead.'
  : 'On-device voice is unavailable here. Type a command below instead.';

interface UseVoiceRecognitionResult {
  /** Drives the orb animation + status label. */
  state: AssistantState;
  /** Live transcript (interim while listening, final once recognized). */
  transcript: string;
  /** Set when permission is denied or the engine reports a problem. */
  error: string | null;
  /** Whether recognition is currently active. */
  recognizing: boolean;
  /** Whether on-device speech recognition is available in this runtime. */
  supported: boolean;
  /** Request permission (if needed) and begin listening. */
  start: () => Promise<void>;
  /** Stop listening and finalize the current result. */
  stop: () => void;
  /** Toggle between start and stop. */
  toggle: () => void;
}

interface Subscription {
  remove: () => void;
}

interface ResultEvent {
  isFinal: boolean;
  results: { transcript?: string }[];
}

interface ErrorEvent {
  error: string;
  message: string;
}

interface SpeechModule {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  /** iOS: mic-only permission. Per docs this avoids the network speech-recognizer auth path. */
  requestMicrophonePermissionsAsync?: () => Promise<{ granted: boolean }>;
  start: (options: { lang: string; interimResults: boolean; continuous: boolean }) => void;
  stop: () => void;
  addListener: (
    event: 'start' | 'end' | 'result' | 'error',
    listener: (payload: never) => void,
  ) => Subscription;
  /** Present from v2+. Returns false when the OS speech engine is unavailable. */
  isRecognitionAvailable?: () => boolean;
}

/**
 * Lazily resolve the native module. expo-speech-recognition is a native module
 * that is absent from Expo Go / the Bilt preview runtime, so importing it at the
 * top level crashes the screen ("cannot find native module ExpoSpeechRecognition").
 * Requiring it on demand inside a try/catch keeps the screen alive everywhere and
 * lets us fall back to the text-command input when it is unavailable.
 */
interface SpeechPackage {
  ExpoSpeechRecognitionModule?: SpeechModule;
}

function loadModule(): SpeechModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: SpeechPackage = require('expo-speech-recognition');
    return mod.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

/**
 * Wraps expo-speech-recognition into a small state machine for the assistant
 * screen. On runtimes without the native module it reports `supported: false`
 * so the UI can offer the text fallback instead of crashing.
 */
export function useVoiceRecognition(
  onFinalResult?: (transcript: string) => void,
): UseVoiceRecognitionResult {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognizing = state === 'listening' || state === 'thinking';

  const moduleRef = useRef<SpeechModule | null>(null);
  const [supported, setSupported] = useState(false);
  const subsRef = useRef<Subscription[]>([]);
  const finalRef = useRef('');
  const onFinalRef = useRef(onFinalResult);
  onFinalRef.current = onFinalResult;

  useEffect(() => {
    // On mount we ONLY probe availability — a cheap read that does not wire up
    // any native event emitters. Listener registration is deferred to start()
    // so that merely opening the screen never crashes on devices where the
    // speech engine is missing or misconfigured.
    let mod: SpeechModule | null = null;
    try {
      mod = loadModule();
      if (
        mod &&
        typeof mod.isRecognitionAvailable === 'function' &&
        !mod.isRecognitionAvailable()
      ) {
        mod = null;
      }
    } catch {
      mod = null;
    }

    moduleRef.current = mod;
    setSupported(mod !== null);
    if (mod === null && isExpoGo) {
      setError(UNAVAILABLE_MESSAGE);
    }

    return () => {
      for (const sub of subsRef.current) {
        try {
          sub.remove();
        } catch {
          /* ignore */
        }
      }
      subsRef.current = [];
    };
  }, []);

  /** Register native event listeners on demand. Returns false if it failed. */
  const registerListeners = useCallback((mod: SpeechModule): boolean => {
    if (subsRef.current.length > 0) return true;
    try {
      subsRef.current = [
        mod.addListener('start', () => {
          setError(null);
          setState('listening');
        }),
        mod.addListener('result', (event: ResultEvent) => {
          const text = event.results[0]?.transcript ?? '';
          setTranscript(text);
          if (event.isFinal) {
            finalRef.current = text;
            setState('thinking');
          }
        }),
        mod.addListener('error', (event: ErrorEvent) => {
          if (event.error === 'no-speech' || event.error === 'aborted') {
            setState('idle');
            return;
          }
          setError(messageForError(event.error, event.message));
          setState('idle');
        }),
        mod.addListener('end', () => {
          setState('idle');
          const final = finalRef.current.trim();
          if (final.length > 0) {
            onFinalRef.current?.(final);
          }
          finalRef.current = '';
        }),
      ];
      return true;
    } catch {
      for (const sub of subsRef.current) {
        try {
          sub.remove();
        } catch {
          /* ignore */
        }
      }
      subsRef.current = [];
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) {
      setError(UNAVAILABLE_MESSAGE);
      return;
    }
    if (!registerListeners(mod)) {
      setSupported(false);
      setError(UNAVAILABLE_MESSAGE);
      return;
    }
    // Re-probe right before starting: the engine can be present yet unavailable
    // on a device (e.g. Siri/Dictation disabled, no speech service installed).
    // Per the library docs, calling start() in that state crashes/hangs, so we
    // bail out to the text fallback instead.
    try {
      if (typeof mod.isRecognitionAvailable === 'function' && !mod.isRecognitionAvailable()) {
        setSupported(false);
        setError(UNAVAILABLE_MESSAGE);
        return;
      }
    } catch {
      setSupported(false);
      setError(UNAVAILABLE_MESSAGE);
      return;
    }

    setTranscript('');
    setError(null);
    finalRef.current = '';
    try {
      const granted = await requestPermission(mod);
      if (!granted) {
        setError('Microphone and speech access are needed to listen.');
        return;
      }
      mod.start({ lang: 'en-US', interimResults: true, continuous: false });
    } catch {
      // start() threw on-device — degrade to the text input rather than crash.
      setSupported(false);
      setError(UNAVAILABLE_MESSAGE);
    }
  }, [registerListeners]);

  const stop = useCallback(() => {
    try {
      moduleRef.current?.stop();
    } catch {
      setState('idle');
    }
  }, []);

  const toggle = useCallback(() => {
    if (recognizing) {
      stop();
    } else {
      void start();
    }
  }, [recognizing, start, stop]);

  return { state, transcript, error, recognizing, supported, start, stop, toggle };
}

/**
 * Request the lightest permission set that still lets recognition run. Per the
 * library docs, the combined requestPermissionsAsync() also asks for the iOS
 * network speech-recognizer authorization, which is the documented source of
 * "permitted in Settings but still fails" issues. We try mic-only first when
 * that API is available and fall back to the combined request otherwise.
 */
async function requestPermission(mod: SpeechModule): Promise<boolean> {
  if (typeof mod.requestMicrophonePermissionsAsync === 'function') {
    try {
      const mic = await mod.requestMicrophonePermissionsAsync();
      if (mic.granted) return true;
    } catch {
      /* fall through to combined request */
    }
  }
  const perms = await mod.requestPermissionsAsync();
  return perms.granted;
}

function messageForError(code: string, message: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Enable it in Settings to use voice.';
    case 'network':
      return 'Network error. Check your connection and try again.';
    case 'language-not-supported':
      return 'That language is not supported for voice on this device.';
    case 'audio-capture':
      return 'No microphone was found.';
    default:
      return message || 'Something went wrong while listening. Try again.';
  }
}
