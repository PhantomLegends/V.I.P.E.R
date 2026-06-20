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
  /** Request permission (if needed) and begin listening. */
  start: () => Promise<void>;
  /** Stop listening and finalize the current result. */
  stop: () => void;
  /** Toggle between start and stop. */
  toggle: () => void;
}

interface WebSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  addEventListener(type: 'start', listener: () => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  addEventListener(
    type: 'error',
    listener: (event: { error: string; message?: string }) => void,
  ): void;
  addEventListener(type: 'result', listener: (event: WebSpeechResultEvent) => void): void;
}

interface WebSpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

type RecognitionCtor = new () => WebSpeechRecognition;

function isRecognitionCtor(value: unknown): value is RecognitionCtor {
  return typeof value === 'function';
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor: unknown =
    Reflect.get(globalThis, 'SpeechRecognition') ??
    Reflect.get(globalThis, 'webkitSpeechRecognition') ??
    null;
  return isRecognitionCtor(ctor) ? ctor : null;
}

/**
 * Web implementation backed by the browser Web Speech API. Falls back to a
 * clear, inline error when the browser does not support speech recognition,
 * so the assistant screen never crashes in the web preview.
 */
export function useVoiceRecognition(
  onFinalResult?: (transcript: string) => void,
): UseVoiceRecognitionResult {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognizing = state === 'listening' || state === 'thinking';

  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const finalRef = useRef('');
  const onFinalRef = useRef(onFinalResult);
  onFinalRef.current = onFinalResult;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    setTranscript('');
    setError(null);
    finalRef.current = '';

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Voice recognition is not supported in this browser. Try it on a device build.');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.addEventListener('start', () => {
      setError(null);
      setState('listening');
    });

    recognition.addEventListener('result', (event) => {
      let text = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        text += result[0]?.transcript ?? '';
        if (result.isFinal) isFinal = true;
      }
      setTranscript(text);
      if (isFinal) {
        finalRef.current = text;
        setState('thinking');
      }
    });

    recognition.addEventListener('error', (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setState('idle');
        return;
      }
      setError(messageForError(event.error, event.message));
      setState('idle');
    });

    recognition.addEventListener('end', () => {
      setState('idle');
      const final = finalRef.current.trim();
      if (final.length > 0) {
        onFinalRef.current?.(final);
      }
      finalRef.current = '';
      recognitionRef.current = null;
    });

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Could not start voice recognition. Try again.');
      setState('idle');
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
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

function messageForError(code: string, message?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Enable it in your browser to use voice.';
    case 'network':
      return 'Network error. Check your connection and try again.';
    case 'language-not-supported':
      return 'That language is not supported for voice in this browser.';
    case 'audio-capture':
      return 'No microphone was found.';
    default:
      return message || 'Something went wrong while listening. Try again.';
  }
}
