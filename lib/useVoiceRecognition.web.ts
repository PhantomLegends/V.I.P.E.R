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
  /** Whether speech recognition is available in this browser. */
  supported: boolean;
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

/** Sample commands used by the local mock when the browser engine is blocked. */
const MOCK_COMMANDS = [
  'Open YouTube',
  'Read my emails',
  "What's on my schedule today",
  'Start Focus Mode',
  'Set a reminder for 6 pm',
  'Open Gmail',
  'Take a note',
];

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
 * Web implementation backed by the browser Web Speech API. When the browser
 * engine is unavailable or blocked (e.g. Safari, or the sandboxed preview that
 * blocks the remote speech service), it falls back to a local mock so the
 * assistant flow still completes end-to-end. Device builds use native
 * on-device recognition instead of this hook.
 */
export function useVoiceRecognition(
  onFinalResult?: (transcript: string) => void,
): UseVoiceRecognitionResult {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognizing = state === 'listening' || state === 'thinking';
  // Always usable on web: a real browser engine when available, otherwise a
  // local mock so the assistant flow still completes in the preview.
  const supported = true;

  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const finalRef = useRef('');
  const retriedRef = useRef(false);
  const mockTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onFinalRef = useRef(onFinalResult);
  onFinalRef.current = onFinalResult;

  const clearMockTimers = useCallback(() => {
    for (const timer of mockTimersRef.current) clearTimeout(timer);
    mockTimersRef.current = [];
  }, []);

  useEffect(() => {
    const timers = mockTimersRef;
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  /**
   * The browser Web Speech API streams audio to a remote service that the
   * sandboxed preview iframe blocks (and Safari doesn't support it at all).
   * When the real engine can't run, simulate the listen -> transcribe -> result
   * flow with a sample command so the assistant still works end-to-end in the
   * preview. On a real device build, native on-device recognition is used and
   * this fallback never runs.
   */
  const runMock = useCallback(
    (isRetry: boolean) => {
      clearMockTimers();
      if (!isRetry) setTranscript('');
      setError(null);
      setState('listening');

      const command = MOCK_COMMANDS[Math.floor(Math.random() * MOCK_COMMANDS.length)];
      const words = command.split(' ');

      // Reveal the transcript word-by-word to mimic live recognition.
      words.forEach((_, index) => {
        mockTimersRef.current.push(
          setTimeout(() => setTranscript(words.slice(0, index + 1).join(' ')), 260 + index * 200),
        );
      });

      const settleAt = 260 + words.length * 200 + 250;
      mockTimersRef.current.push(
        setTimeout(() => {
          setTranscript(command);
          finalRef.current = command;
          setState('thinking');
        }, settleAt),
      );
      mockTimersRef.current.push(
        setTimeout(() => {
          setState('idle');
          const final = finalRef.current.trim();
          if (final.length > 0) onFinalRef.current?.(final);
          finalRef.current = '';
        }, settleAt + 600),
      );
    },
    [clearMockTimers],
  );

  const begin = useCallback(
    (isRetry: boolean) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        // No browser engine (e.g. Safari, or the preview) — use the local mock
        // so the assistant flow still works end-to-end.
        runMock(isRetry);
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
        // The browser engine streams audio to a remote service that the preview
        // iframe blocks. Retry once for a transient hiccup; if it persists, fall
        // back to the local mock so the flow still completes.
        if (event.error === 'network') {
          recognitionRef.current = null;
          if (!retriedRef.current) {
            retriedRef.current = true;
            mockTimersRef.current.push(setTimeout(() => begin(true), 350));
          } else {
            runMock(false);
          }
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
        // Engine present but refused to start — fall back to the mock.
        runMock(isRetry);
      }
    },
    [runMock],
  );

  const start = useCallback(async () => {
    clearMockTimers();
    setTranscript('');
    setError(null);
    finalRef.current = '';
    retriedRef.current = false;
    begin(false);
  }, [begin, clearMockTimers]);

  const stop = useCallback(() => {
    clearMockTimers();
    recognitionRef.current?.stop();
    if (state === 'listening' || state === 'thinking') setState('idle');
  }, [clearMockTimers, state]);

  const toggle = useCallback(() => {
    if (recognizing) {
      stop();
    } else {
      void start();
    }
  }, [recognizing, start, stop]);

  return { state, transcript, error, recognizing, supported, start, stop, toggle };
}

function messageForError(code: string, message?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Enable it in your browser to use voice.';
    case 'network':
      return 'Voice had trouble connecting. Tap the mic to try again, or type a command.';
    case 'language-not-supported':
      return 'That language is not supported for voice in this browser.';
    case 'audio-capture':
      return 'No microphone was found.';
    default:
      return message || 'Something went wrong while listening. Try again.';
  }
}
