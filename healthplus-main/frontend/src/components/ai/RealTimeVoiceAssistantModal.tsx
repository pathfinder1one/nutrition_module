import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Send,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { HoloOrb3D } from '@/components/3d/HoloOrb3D';
import { useApp } from '@/context/AppContext';
import type { ConversationLanguage } from '@/types/wellness';

export type VoiceAssistantPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface WorkoutVoiceContext {
  exerciseLabel?: string;
  category?: string;
  currentReps?: number;
  targetReps?: number;
  formStatus?: string;
  caloriesBurned?: number;
}

export interface RealTimeVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutContext?: WorkoutVoiceContext;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export const RealTimeVoiceAssistantModal: React.FC<RealTimeVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  workoutContext,
}) => {
  const { state, sendUserMessage } = useApp();
  const [phase, setPhase] = useState<VoiceAssistantPhase>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [history, setHistory] = useState<MessageItem[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [textInput, setTextInput] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(isOpen);
  const continuousModeRef = useRef<boolean>(continuousMode);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  isOpenRef.current = isOpen;
  continuousModeRef.current = continuousMode;

  const prefLang = state.profile?.lifestyle.preferredLanguage ?? 'auto';
  const detectedLang = state.conversationMemory.detectedLanguage;
  const activeLang: ConversationLanguage =
    prefLang === 'auto' ? detectedLang : (prefLang as ConversationLanguage);

  // Auto-scroll conversation
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, assistantReply, interimTranscript]);

  // Clean markdown for speech
  const cleanForSpeech = (raw: string): string => {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/•/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Speak aloud via SpeechSynthesis
  const speakAloud = useCallback(
    (textToSpeak: string, language: ConversationLanguage = 'hinglish') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setPhase('idle');
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (!soundEnabled) {
          setPhase('idle');
          return;
        }

        const cleaned = cleanForSpeech(textToSpeak);
        if (!cleaned) {
          setPhase('idle');
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to pick natural voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) => /hi[-_]in/i.test(v.lang)) ||
          voices.find((v) => /en[-_]in/i.test(v.lang)) ||
          voices.find((v) => /natural|neural|google/i.test(v.name)) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        isSpeakingRef.current = true;
        setPhase('speaking');

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setPhase('speaking');
        };

        utterance.onend = () => {
          isSpeakingRef.current = false;
          setPhase('idle');
          // If continuous voice talk mode is ON and modal is still open, re-listen!
          if (isOpenRef.current && continuousModeRef.current) {
            setTimeout(() => {
              if (isOpenRef.current && !isSpeakingRef.current) {
                startListening();
              }
            }, 800);
          }
        };

        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setPhase('idle');
          if (isOpenRef.current && continuousModeRef.current) {
            setTimeout(() => {
              if (isOpenRef.current && !isSpeakingRef.current) {
                startListening();
              }
            }, 800);
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        isSpeakingRef.current = false;
        setPhase('idle');
      }
    },
    [soundEnabled]
  );

  // Send query to the model
  const submitToModel = useCallback(
    async (spokenQuery: string) => {
      const clean = spokenQuery.trim();
      if (!clean) {
        setPhase('idle');
        return;
      }

      // Add to local history
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: clean, time: now },
      ]);
      setInterimTranscript('');
      setPhase('thinking');

      // Stop speech recognition while thinking and replying
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      // Context enrichment with live workout telemetry
      let enrichedPrompt = clean;
      if (workoutContext && workoutContext.exerciseLabel) {
        enrichedPrompt = `[Live Workout Telemetry: Exercise: ${workoutContext.exerciseLabel}, Muscle Group: ${
          workoutContext.category || 'Standard'
        }, Reps Completed: ${workoutContext.currentReps ?? 0}/${
          workoutContext.targetReps ?? 12
        }, Current Form Feedback: ${
          workoutContext.formStatus || 'Active'
        }]. The user asks your real-time fitness coach voice assistant: "${clean}". Answer concisely in 2-3 friendly, energetic conversational sentences with natural spoken tone.`;
      }

      try {
        const reply = await sendUserMessage(enrichedPrompt, null);
        const replyText = reply.content;
        const replyLang = reply.language || activeLang;

        setAssistantReply(replyText);
        setHistory((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Speak back aloud as voice assistant
        speakAloud(replyText, replyLang);
      } catch (err) {
        const fallbackText =
          activeLang === 'hi'
            ? 'Aapki exercise form achhi chal rahi hai! Bas steady breathing aur controlled tempo maintain karein.'
            : 'You are doing great! Keep your core tight, breathe steadily, and maintain controlled tempo through every rep.';
        setAssistantReply(fallbackText);
        speakAloud(fallbackText, activeLang);
      }
    },
    [workoutContext, sendUserMessage, activeLang, speakAloud]
  );

  // Start speech recognition
  const startListening = useCallback(() => {
    setMicError(null);
    if (typeof window === 'undefined') return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setMicError('Speech recognition is not supported in this browser. You can type or use the quick chips below.');
      setPhase('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = activeLang === 'hi' || activeLang === 'hinglish' ? 'hi-IN' : 'en-IN';

      let lastRecognized = '';

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          lastRecognized = currentText;
          setInterimTranscript(currentText);

          // Clear existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Silence timeout: when user pauses talking for 1.3s, submit to model automatically!
          silenceTimerRef.current = setTimeout(() => {
            if (lastRecognized && !isSpeakingRef.current) {
              submitToModel(lastRecognized);
            }
          }, 1300);
        }
      };

      rec.onerror = (ev: any) => {
        if (ev.error === 'no-speech') {
          // Normal silence, restart if continuous
          return;
        }
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setMicError('Microphone permission blocked. Please allow microphone access in your browser bar.');
          setPhase('idle');
        } else {
          setMicError(`Voice capture note: ${ev.error}`);
        }
      };

      rec.onend = () => {
        // If still listening and not speaking, re-open mic if continuous
        if (isOpenRef.current && phase === 'listening' && !isSpeakingRef.current) {
          try {
            rec.start();
          } catch {
            // ignore
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
      setPhase('listening');
    } catch (e: any) {
      setMicError('Could not activate microphone. Check browser permissions.');
      setPhase('idle');
    }
  }, [activeLang, phase, submitToModel]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setPhase('idle');
  }, []);

  // On open/close effect
  useEffect(() => {
    if (isOpen) {
      setHistory([
        {
          id: 'welcome',
          role: 'assistant',
          text: workoutContext?.exerciseLabel
            ? `Namaste! Main aapka Real-Time Voice Assistant hu. Aap abhi ${workoutContext.exerciseLabel} kar rahe hain. Koi bhi sawaal puchiye ya form check karwaiye!`
            : 'Namaste! Real-Time Voice Assistant active hai. Aap boliye, main sun raha hu!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      // Greeting spoken automatically on launch
      speakAloud(
        workoutContext?.exerciseLabel
          ? `Namaste! Aap abhi ${workoutContext.exerciseLabel} kar rahe hain. Main ready hu, boliye!`
          : 'Namaste! Real-Time Voice Assistant ready hai, boliye!'
      );
      // Wait for welcome greeting to finish or start listening
      setTimeout(() => {
        if (isOpenRef.current && !isSpeakingRef.current) {
          startListening();
        }
      }, 1500);
    } else {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPhase('idle');
      setInterimTranscript('');
      setAssistantReply('');
    }
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    workoutContext?.exerciseLabel ? `${workoutContext.exerciseLabel} me sahi posture kya hai?` : 'Meri form check karo',
    'Agla rep count karo aur tips do',
    'Knees me strain se kaise bachein?',
    'Post-workout snack me kya lu?',
    'Thoda energetic motivation do!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#061812] via-[#09221A] to-[#04120D] border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Glow Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-emerald-950/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <Radio className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                  Real-Time Voice Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Voice
                </span>
              </div>
              <p className="text-xs text-emerald-100/70">
                {workoutContext?.exerciseLabel
                  ? `Active Coaching: ${workoutContext.exerciseLabel} (${workoutContext.currentReps ?? 0}/${workoutContext.targetReps ?? 12} reps)`
                  : 'Talk hands-free with your personal AI trainer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              title={soundEnabled ? 'Model Voice Aloud: ON' : 'Model Voice Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/80 hover:text-white border border-white/10 transition-colors"
              title="Close Voice Talk Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Orb Visualizer & Reactive Status */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center border-b border-emerald-500/15 bg-black/20 shrink-0">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center my-1">
            <HoloOrb3D reactivePhase={phase} className="w-full h-full" />
            
            {/* Pulsing Acoustic Rings when listening/speaking */}
            {phase === 'listening' && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
            )}
            {phase === 'speaking' && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-300/60 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Real-time Status Badge */}
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-2 shadow-sm transition-all ${
                phase === 'listening'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : phase === 'thinking'
                    ? 'bg-amber-500 text-black animate-pulse'
                    : phase === 'speaking'
                      ? 'bg-emerald-400 text-forest shadow-emerald-400/40'
                      : 'bg-white/10 text-white/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>
                {phase === 'listening'
                  ? 'Listening… Speak naturally'
                  : phase === 'thinking'
                    ? 'AI Model is Thinking…'
                    : phase === 'speaking'
                      ? 'Voice Assistant Speaking Aloud…'
                      : 'Voice Assistant Ready'}
              </span>
            </div>

            {/* Continuous Mode Pill */}
            <button
              type="button"
              onClick={() => setContinuousMode((c) => !c)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                continuousMode
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
              title="Continuous mode automatically listens after assistant speaks"
            >
              {continuousMode ? '⚡ Hands-free Loop: ON' : 'Tap to Speak'}
            </button>
          </div>

          {/* Live Interim Speech Bubble */}
          {interimTranscript && phase === 'listening' && (
            <div className="mt-3 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium text-center animate-fadeIn max-w-md">
              <span className="opacity-70">Hearing you: </span>
              <strong>"{interimTranscript}"</strong>
            </div>
          )}

          {micError && (
            <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-xl">
              {micError}
            </div>
          )}
        </div>

        {/* Conversation Dialogue History */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 min-h-[160px] max-h-[260px] text-left scroll-smooth"
        >
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-white/10 text-emerald-50 border border-white/10 rounded-tl-xs backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-bold mb-1">
                  <span>{msg.role === 'user' ? 'You (Voice)' : 'AI Fitness Coach'}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="whitespace-pre-line">{cleanForSpeech(msg.text)}</p>
              </div>
            </div>
          ))}

          {phase === 'thinking' && (
            <div className="flex items-center gap-2 text-xs text-amber-300 animate-pulse pl-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyzing movement &amp; formulating personal answer…</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-black/30 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-white/50 whitespace-nowrap">Ask Coach:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => submitToModel(prompt)}
              className="px-3 py-1 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-white/10 hover:border-emerald-500/40 text-[11px] font-medium whitespace-nowrap transition-all shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Interactive Controls */}
        <div className="p-3 sm:p-4 bg-emerald-950/40 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-center">
            {phase === 'listening' ? (
              <button
                type="button"
                onClick={stopListening}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/40 transition-all scale-100 hover:scale-[1.02]"
              >
                <MicOff className="w-4 h-4" />
                <span>Pause Listening</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-900/40 transition-all scale-100 hover:scale-[1.02]"
              >
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Tap to Speak</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setPhase('idle');
              }}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
              title="Interrupt & Silence"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick text fallback if user prefers typing */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                submitToModel(textInput.trim());
                setTextInput('');
              }
            }}
            className="flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type anything — model will speak answer aloud..."
              className="flex-1 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 outline-hidden"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 disabled:opacity-40 text-white transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
