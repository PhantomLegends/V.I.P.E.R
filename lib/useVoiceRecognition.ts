import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssistantState } from './types';

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
  start: (options: { lang: string; interimResults: boolean; continuous: boolean }) => void;
  stop: () => void;
  addListener: (
    event: 'start' | 'end' | 'result' | 'error',
    listener: (payload: never) => void,
  ) => Subscription;
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
    const mod = loadModule();
    moduleRef.current = mod;
    setSupported(mod !== null);
    if (!mod) return () => {};

    const subs: Subscription[] = [
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
    subsRef.current = subs;

    return () => {
      for (const sub of subs) sub.remove();
      subsRef.current = [];
    };
  }, []);

  const start = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) {
      setError('On-device voice is unavailable here. Type a command below instead.');
      return;
    }
    setTranscript('');
    setError(null);
    finalRef.current = '';
    try {
      const perms = await mod.requestPermissionsAsync();
      if (!perms.granted) {
        setError('Microphone and speech access are needed to listen.');
        return;
      }
      mod.start({ lang: 'en-US', interimResults: true, continuous: false });
    } catch {
      setError('Voice recognition is not available on this device.');
    }
  }, []);

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
