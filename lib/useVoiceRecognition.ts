import { useCallback, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
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
  /** Request permission (if needed) and begin listening. */
  start: () => Promise<void>;
  /** Stop listening and finalize the current result. */
  stop: () => void;
  /** Toggle between start and stop. */
  toggle: () => void;
}

/**
 * Wraps expo-speech-recognition into a small state machine that the assistant
 * screen can render directly. Works on iOS, Android, and supported browsers.
 */
export function useVoiceRecognition(
  onFinalResult?: (transcript: string) => void,
): UseVoiceRecognitionResult {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognizing = state === 'listening' || state === 'thinking';
  const finalRef = useRef('');

  useSpeechRecognitionEvent('start', () => {
    setError(null);
    setState('listening');
  });

  useSpeechRecognitionEvent('end', () => {
    setState('idle');
    const final = finalRef.current.trim();
    if (final.length > 0) {
      onFinalResult?.(final);
    }
    finalRef.current = '';
  });

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (!result) return;
    const text = result.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) {
      finalRef.current = text;
      setState('thinking');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      setState('idle');
      return;
    }
    setError(messageForError(event.error, event.message));
    setState('idle');
  });

  const start = useCallback(async () => {
    setTranscript('');
    finalRef.current = '';
    try {
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) {
        setError('Microphone and speech access are needed to listen.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } catch {
      setError('Voice recognition is not available on this device.');
    }
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recognizing) {
      stop();
    } else {
      void start();
    }
  }, [recognizing, start, stop]);

  return { state, transcript, error, recognizing, start, stop, toggle };
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
