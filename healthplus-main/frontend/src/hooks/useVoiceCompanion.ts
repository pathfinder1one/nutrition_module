import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ConversationLanguage } from '@/types/wellness';

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type SpeechRateOption = 0.85 | 1.0 | 1.15;

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
}

export interface VoiceProviderInfo {
  id: 'browser_web_speech';
  label: string;
  sttSupported: boolean;
  ttsSupported: boolean;
  micPermission: MicPermissionState;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useVoiceCompanion(defaultLang: 'auto' | ConversationLanguage = 'auto') {
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const sttSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    );

  const ttsSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [speechRate, setSpeechRate] = useState<SpeechRateOption>(1.0);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [micPermission, setMicPermission] = useState<MicPermissionState>(() =>
    sttSupported ? 'prompt' : 'unsupported'
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    if (!sttSupported) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          setMicPermission(status.state as MicPermissionState);
          status.onchange = () => setMicPermission(status.state as MicPermissionState);
        })
        .catch(() => {
          setMicPermission('prompt');
        });
    }
  }, [sttSupported]);

  useEffect(() => {
    if (!ttsSupported) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      const filtered = voices
        .filter((v) => /^(en|hi)/i.test(v.lang))
        .slice(0, 12)
        .map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
      const list =
        filtered.length > 0
          ? filtered
          : voices.slice(0, 8).map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
      setAvailableVoices(list);
      setSelectedVoiceURI((prev) => prev || list[0]?.voiceURI || '');
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsSupported]);

  const voiceProviderInfo: VoiceProviderInfo = useMemo(
    () => ({
      id: 'browser_web_speech',
      label: sttSupported || ttsSupported
        ? 'Browser Web Speech (Device TTS/STT)'
        : 'Speech APIs Unavailable (Text Chat Active)',
      sttSupported,
      ttsSupported,
      micPermission,
    }),
    [sttSupported, ttsSupported, micPermission]
  );

  const stopAllVoice = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoicePhase('idle');
  }, []);

  useEffect(() => {
    return () => {
      stopAllVoice();
    };
  }, [stopAllVoice]);

  const startListening = useCallback(() => {
    setSpeechError(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoicePhase('idle');
      setSpeechError(
        'Live microphone dictation is unavailable in this browser/headless mode — type or edit your message directly below.'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = defaultLang === 'hi' || defaultLang === 'hinglish' ? 'hi-IN' : 'en-IN';

      rec.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
        }
        setTranscript(combined.trim());
      };

      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setMicPermission('denied');
          setSpeechError(
            'Microphone permission denied — allow mic access in browser settings or type directly below.'
          );
        } else {
          setSpeechError('Microphone input could not be captured — you can edit text directly.');
        }
        setVoicePhase('idle');
      };

      rec.onend = () => {
        setVoicePhase((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = rec;
      setVoicePhase('listening');
      rec.start();
    } catch {
      setSpeechError('Could not start voice capture — type directly instead.');
      setVoicePhase('idle');
    }
  }, [defaultLang]);

  const speakText = useCallback(
    (rawText: string, language: ConversationLanguage) => {
      if (!voiceOutputEnabled || !ttsSupported) {
        setVoicePhase('idle');
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const cleanSpoken = rawText
          .replace(/\*\*/g, '')
          .replace(/•/g, '')
          .replace(/\n+/g, '. ');

        const utterance = new SpeechSynthesisUtterance(cleanSpoken);
        utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
        utterance.rate = speechRate;

        if (selectedVoiceURI) {
          const picked = window.speechSynthesis
            .getVoices()
            .find((v) => v.voiceURI === selectedVoiceURI);
          if (picked) {
            utterance.voice = picked;
          }
        }

        utterance.onstart = () => setVoicePhase('speaking');
        utterance.onend = () => setVoicePhase('idle');
        utterance.onerror = () => setVoicePhase('idle');

        setVoicePhase('speaking');
        window.speechSynthesis.speak(utterance);
      } catch {
        setVoicePhase('idle');
      }
    },
    [voiceOutputEnabled, ttsSupported, speechRate, selectedVoiceURI]
  );

  return {
    voicePhase,
    setVoicePhase,
    transcript,
    setTranscript,
    speechError,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    speechRate,
    setSpeechRate,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    voiceProviderInfo,
    startListening,
    speakText,
    stopAllVoice,
  };
}
