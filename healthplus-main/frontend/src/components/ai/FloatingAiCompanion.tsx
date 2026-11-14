import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Square,
  ShieldAlert,
  Camera,
  Radio,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useVoiceCompanion } from '@/hooks/useVoiceCompanion';
import { RealTimeVoiceAssistantModal } from '@/components/ai/RealTimeVoiceAssistantModal';
import type { ChatActionChip } from '@/types/wellness';

export interface FloatingAiCompanionProps {
  onNavigate?: (path: string) => void;
}

function renderFormattedText(content: string): React.ReactNode {
  return content.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, idx) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={idx} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={idx}>{part}</React.Fragment>
          )
        )}
      </p>
    );
  });
}

export const FloatingAiCompanion: React.FC<FloatingAiCompanionProps> = ({
  onNavigate = () => {},
}) => {
  const { state, sendUserMessage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const prefLang = state.profile?.lifestyle.preferredLanguage ?? 'auto';
  const {
    voicePhase,
    setVoicePhase,
    transcript,
    setTranscript,
    speechError,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    startListening,
    speakText,
    stopAllVoice,
  } = useVoiceCompanion(prefLang);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, state.chatMessages.length]);

  if (!state.onboardingCompleted) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(f);
  };

  const clearSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitMessage = async (textToSend?: string) => {
    const clean = (textToSend ?? inputRef.current?.value ?? transcript).trim();
    if (!clean && !selectedPhotoFile) return;

    const fileToSend = selectedPhotoFile;
    clearSelectedPhoto();
    setTranscript('');
    if (!textToSend && inputRef.current) {
      inputRef.current.value = '';
    }
    setVoicePhase('thinking');

    try {
      const reply = await sendUserMessage(clean, fileToSend);
      if (voiceOutputEnabled) {
        speakText(reply.content, reply.language);
      } else {
        setVoicePhase('idle');
      }
    } catch {
      setVoicePhase('idle');
    }
  };

  const handleChip = (chip: ChatActionChip) => {
    if (chip.actionType === 'navigate_food') {
      setIsOpen(false);
      onNavigate('/food');
      return;
    }
    if (chip.actionType === 'navigate_move') {
      setIsOpen(false);
      onNavigate('/move');
      return;
    }
    submitMessage(chip.promptText);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Health Plus Voice & Text Companion"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-forest dark:bg-emerald-900 text-white shadow-2xl border border-gold/40 hover:scale-[1.03] transition-transform"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold" />
          </span>
          <Bot className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold tracking-tight hidden sm:inline">
            Ask AI Companion
          </span>
        </button>
      ) : (
        <div className="w-[calc(100vw-2rem)] sm:w-96 max-h-[78vh] rounded-3xl bg-white/95 dark:bg-[#071B14]/95 backdrop-blur-2xl border border-forest/15 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden text-left">
          {/* Header with Interactive Voice Orbital Ring */}
          <div className="px-4 py-3 border-b border-forest/10 dark:border-white/10 bg-forest dark:bg-[#0A251B] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  voicePhase === 'listening'
                    ? 'border-gold bg-gold/20 scale-105'
                    : voicePhase === 'thinking'
                      ? 'border-emerald-300 animate-spin bg-emerald/25'
                      : voicePhase === 'speaking'
                        ? 'border-emerald-300 animate-pulse bg-emerald/30'
                        : 'border-white/20 bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Health Plus Voice &amp; Chat</p>
                <p className="text-[10px] text-emerald-200">
                  {voicePhase === 'listening'
                    ? 'Listening… edit anytime below'
                    : voicePhase === 'thinking'
                      ? 'Checking kitchen & safety rules…'
                      : voicePhase === 'speaking'
                        ? 'Speaking aloud'
                        : 'Hindi · Hinglish · English'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {voicePhase === 'speaking' && (
                <button
                  type="button"
                  onClick={stopAllVoice}
                  title="Stop speaking"
                  className="px-2 py-1 rounded-lg bg-rose-500/80 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Square className="w-2.5 h-2.5" />
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLiveVoiceModal(true)}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Open Real-Time Voice Talk Mode"
              >
                <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
                <span>Voice Talk</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceOutputEnabled((v) => !v)}
                aria-label="Toggle voice output"
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                {voiceOutputEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-300" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/60" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close companion"
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {state.chatMessages.slice(-8).map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-forest text-white dark:bg-emerald'
                      : 'bg-forest/6 dark:bg-white/8 text-forest dark:text-ivory border border-forest/10 dark:border-white/10'
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl border border-white/20">
                      <img
                        src={msg.imageUrl}
                        alt="Meal plate photo"
                        className="w-full max-h-36 object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {renderFormattedText(msg.content)}

                  {msg.preprocessedImageUrl && (
                    <div className="mt-2 p-1.5 rounded-xl bg-forest/5 dark:bg-black/25 border border-forest/10 dark:border-white/10">
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>OpenCV CLAHE Enhanced</span>
                      </div>
                      <img
                        src={msg.preprocessedImageUrl}
                        alt="OpenCV CLAHE Enhanced plate"
                        className="w-full max-h-32 object-cover rounded-lg border border-forest/10 dark:border-white/10"
                      />
                    </div>
                  )}
                  {msg.safetyNotice && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10px] flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-gold shrink-0 mt-0.5" />
                      <span>{msg.safetyNotice}</span>
                    </div>
                  )}
                </div>

                {msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {msg.actionChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleChip(chip)}
                        className="px-2.5 py-1 rounded-full border border-emerald/35 bg-emerald/10 text-[10px] font-bold text-forest dark:text-emerald-300 hover:bg-emerald/20"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Selected photo preview strip */}
          {selectedPhotoPreview && (
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-2 bg-ivory/70 dark:bg-[#06150F] border-t border-forest/10 dark:border-white/10">
              <div className="relative shrink-0">
                <img
                  src={selectedPhotoPreview}
                  alt="Selected plate"
                  className="w-10 h-10 object-cover rounded-lg border-2 border-emerald"
                />
                <button
                  type="button"
                  onClick={clearSelectedPhoto}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow hover:bg-rose-600"
                  title="Remove photo"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[10px] font-semibold text-emerald truncate">
                Plate photo attached · Ready to scan
              </span>
            </div>
          )}

          {/* Speech feedback / Transcript Correction Bar */}
          <div className="p-3 border-t border-forest/10 dark:border-white/10 space-y-2 bg-ivory/70 dark:bg-[#06150F]">
            {speechError && (
              <p className="text-[10px] text-amber-700 dark:text-gold px-1">{speechError}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
              className="flex items-center gap-1.5"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {/* Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-white dark:bg-white/5 border border-forest/15 dark:border-white/15 text-emerald hover:bg-emerald/10 shrink-0 flex items-center justify-center transition-all"
                title="Scan food plate photo"
              >
                <Camera className="w-4 h-4 text-emerald" />
              </button>

              <button
                type="button"
                onClick={() =>
                  voicePhase === 'listening' ? stopAllVoice() : startListening()
                }
                aria-label="Speak"
                className={`p-2 rounded-xl border transition-colors shrink-0 ${
                  voicePhase === 'listening'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-white/5 border-forest/15 dark:border-white/15 text-forest dark:text-white'
                }`}
              >
                {voicePhase === 'listening' ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald" />
                )}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Ask, speak, or click 📷 to scan plate…"
                className="flex-1 rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-xs text-forest dark:text-white focus:outline-none focus:border-emerald"
              />

              <button
                type="submit"
                aria-label="Send message"
                className="p-2 rounded-xl bg-emerald text-white hover:bg-emerald/90 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Voice Talk Modal */}
      <RealTimeVoiceAssistantModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
      />
    </div>
  );
};
