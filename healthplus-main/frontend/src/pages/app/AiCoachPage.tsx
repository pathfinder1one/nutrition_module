import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Plus,
  Camera,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import {
  useVoiceCompanion,
  type SpeechRateOption,
} from '@/hooks/useVoiceCompanion';
import { getIngredientLabel } from '@/engine/nutritionCatalog';
import { HoloOrb3D } from '@/components/3d/HoloOrb3D';
import type { ChatActionChip } from '@/types/wellness';

export interface AiCoachPageProps {
  onNavigate?: (path: string) => void;
}

function renderMessageBody(content: string): React.ReactNode {
  return content.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
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

export const AiCoachPage: React.FC<AiCoachPageProps> = ({ onNavigate = () => {} }) => {
  const {
    state,
    activeSafetyBanners,
    logMeal,
    sendUserMessage,
    aiProviderMode,
    aiProviderLabel,
    persistenceMode,
  } = useApp();
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [loggedNote, setLoggedNote] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const threadContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isVoiceInputActiveRef = useRef<boolean>(false);

  const profile = state.profile;
  const targets = state.targets;
  const prefLang = profile?.lifestyle.preferredLanguage ?? 'auto';

  const {
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
  } = useVoiceCompanion(prefLang);

  useEffect(() => {
    const el = threadContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.chatMessages.length]);

  if (!profile || !targets) return null;

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

  const handleSubmit = async (overrideText?: string) => {
    const isFromVoice = isVoiceInputActiveRef.current && !overrideText;
    isVoiceInputActiveRef.current = false;

    const clean = (overrideText ?? inputRef.current?.value ?? transcript).trim();
    if (!clean && !selectedPhotoFile) return;

    const fileToSend = selectedPhotoFile;
    clearSelectedPhoto();
    setTranscript('');
    if (inputRef.current) inputRef.current.value = '';
    setVoicePhase('thinking');

    try {
      const reply = await sendUserMessage(clean, fileToSend);
      // ONLY speak out loud if the user explicitly used the mic to talk!
      // If the user typed text, NEVER auto-speak aloud!
      if (isFromVoice && voiceOutputEnabled) {
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
      onNavigate('/food');
      return;
    }
    if (chip.actionType === 'navigate_move') {
      onNavigate('/move');
      return;
    }
    handleSubmit(chip.promptText);
  };

  const quickStarters = [
    '📸 Scan food plate',
    'Maine 2 aloo parathe aur dahi khaya',
    'Mera nutrition pattern kaisa hai?',
    'What should I eat for dinner tonight?',
    'Aaj raat dinner mein kya banau?',
    "I don't have paneer at home",
  ];

  const handleStarterClick = (q: string) => {
    if (q.includes('Scan food plate')) {
      fileInputRef.current?.click();
      return;
    }
    handleSubmit(q);
  };

  const rememberedUnavailable = Array.from(
    new Set([
      ...profile.foodAvailability.unavailableIngredients,
      ...state.conversationMemory.unavailableIngredients,
    ])
  );

  return (
    <div className="space-y-5 pb-20 text-left animate-fadeIn max-w-4xl mx-auto">
      {/* Header + Alexa/Jarvis Interactive Voice Stage */}
      <Card variant="elevated" className="overflow-hidden border-emerald/20 p-0">
        <div className="p-5 sm:p-6 bg-gradient-to-br from-forest to-[#0D3229] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Reactive 3D Neural Companion Core */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-2xl bg-black/20 border border-white/15 overflow-hidden">
              <HoloOrb3D reactivePhase={voicePhase} className="w-full h-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="gold" size="sm">
                  Hindi · Hinglish · English
                </Badge>
                <span className="text-[11px] text-emerald-200 font-semibold">
                  {voicePhase === 'listening'
                    ? 'Listening to you — edit text anytime'
                    : voicePhase === 'thinking'
                      ? 'Checking pantry, goals & safety rules…'
                      : voicePhase === 'speaking'
                        ? 'Speaking response aloud'
                        : `Ready for ${profile.basic.name}`}
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl">
                Personal AI Wellness Companion
              </h1>
              <p className="text-xs text-white/75">
                Remembers kitchen ingredients across turns and filters every answer by your safety profile.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={voicePhase === 'listening' ? 'danger' : 'gold'}
              onClick={() => {
                if (voicePhase === 'listening') {
                  isVoiceInputActiveRef.current = false;
                  stopAllVoice();
                } else {
                  isVoiceInputActiveRef.current = true;
                  setVoiceOutputEnabled(true);
                  startListening();
                }
              }}
              leftIcon={voicePhase === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            >
              {voicePhase === 'listening' ? 'Stop Mic' : 'Talk by Voice'}
            </Button>

            {voicePhase === 'speaking' && (
              <Button
                size="sm"
                variant="danger"
                onClick={stopAllVoice}
                leftIcon={<Square className="w-3.5 h-3.5" />}
              >
                Interrupt
              </Button>
            )}

            <button
              type="button"
              onClick={() => setVoiceOutputEnabled((v) => !v)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              aria-label="Toggle voice response"
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Active Memory, Provider Honesty & Voice Preferences Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full font-semibold ${
                aiProviderMode === 'live_llm_gateway'
                  ? 'bg-emerald/15 text-emerald dark:text-emerald-300'
                  : 'bg-forest/8 dark:bg-white/10 text-forest/80 dark:text-ivory/80'
              }`}
            >
              AI Mode: {aiProviderLabel}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-forest/6 dark:bg-white/8 text-forest/75 dark:text-ivory/75 font-semibold">
              Storage:{' '}
              {persistenceMode === 'supabase_connected'
                ? 'Supabase Sync'
                : 'Local Browser Vault Only'}
            </span>
            {rememberedUnavailable.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/12 text-rose-700 dark:text-rose-300 font-semibold">
                Memory excluded:{' '}
                {rememberedUnavailable.map((i) => getIngredientLabel(i).split(' / ')[0]).join(', ')}
              </span>
            )}
            {activeSafetyBanners.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-gold font-semibold">
                {activeSafetyBanners.length} safety rule(s) active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowVoiceSettings((v) => !v)}
              className="inline-flex items-center gap-1 font-semibold text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white"
            >
              <span>{showVoiceSettings ? 'Hide Voice Controls' : 'Voice Controls'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPipelineDetails((v) => !v)}
              className="inline-flex items-center gap-1 font-semibold text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white"
            >
              {showPipelineDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>
                {showPipelineDetails ? 'Hide reasoning trace' : 'Show safety & pipeline trace'}
              </span>
            </button>
          </div>
        </div>

        {showVoiceSettings && (
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#0A1E17] border border-forest/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-forest dark:text-white">
                {voiceProviderInfo.label}
              </p>
              <p className="text-[11px] text-forest/65 dark:text-ivory/65">
                Mic status: <span className="font-semibold">{voiceProviderInfo.micPermission}</span> · Spoken output:{' '}
                <span className="font-semibold">
                  {voiceProviderInfo.ttsSupported ? 'Available' : 'Unavailable'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-forest/70 dark:text-ivory/70">Speed:</span>
                {([0.85, 1.0, 1.15] as SpeechRateOption[]).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                      speechRate === rate
                        ? 'bg-emerald text-white border-emerald'
                        : 'bg-forest/5 dark:bg-white/5 text-forest dark:text-ivory border-forest/15 dark:border-white/15'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {availableVoices.length > 0 && (
                <select
                  aria-label="Select spoken voice"
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="px-2 py-1 rounded-lg text-[11px] bg-white dark:bg-[#0D281E] border border-forest/15 dark:border-white/15 text-forest dark:text-white"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {loggedNote && (
        <div className="p-3 rounded-xl bg-emerald/15 border border-emerald/30 text-xs font-semibold text-forest dark:text-emerald-200">
          {loggedNote}
        </div>
      )}

      {/* Conversational Thread */}
      <Card variant="elevated" className="p-4 sm:p-5">
        <div className="space-y-4">
          <div
            ref={threadContainerRef}
            className="space-y-4 h-[38vh] min-h-[250px] max-h-[360px] overflow-y-auto pr-1"
          >
            {state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-forest text-white dark:bg-emerald'
                      : 'bg-forest/5 dark:bg-white/6 border border-forest/10 dark:border-white/10 text-forest dark:text-ivory'
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20">
                      <img
                        src={msg.imageUrl}
                        alt="Meal plate photo"
                        className="w-full max-h-48 object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {renderMessageBody(msg.content)}

                  {msg.preprocessedImageUrl && (
                    <div className="mt-3 p-2 rounded-xl bg-forest/5 dark:bg-black/25 border border-forest/10 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>OpenCV CLAHE Enhanced Preview</span>
                      </div>
                      <img
                        src={msg.preprocessedImageUrl}
                        alt="OpenCV CLAHE Enhanced plate"
                        className="w-full max-h-40 object-cover rounded-lg border border-forest/10 dark:border-white/10"
                      />
                    </div>
                  )}

                  {msg.safetyNotice && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-gold shrink-0 mt-0.5" />
                      <span>{msg.safetyNotice}</span>
                    </div>
                  )}

                  {/* Quick 1-click log pills when companion attaches safe recommendations */}
                  {msg.recommendedRecipes && msg.recommendedRecipes.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-forest/10 dark:border-white/10 flex flex-wrap gap-2">
                      {msg.recommendedRecipes.map((rec) => (
                        <button
                          key={rec.recipe.id}
                          type="button"
                          onClick={() => {
                            logMeal({
                              recipeId: rec.recipe.id,
                              name: rec.recipe.name,
                              mealSlot: rec.recipe.mealSlot,
                              calories: rec.recipe.macros.calories,
                              proteinG: rec.recipe.macros.proteinG,
                              carbsG: rec.recipe.macros.carbsG,
                              fatG: rec.recipe.macros.fatG,
                              fiberG: rec.recipe.macros.fiberG,
                              sodiumMg: rec.recipe.macros.sodiumMg,
                              source: 'recommended_recipe',
                              provenanceLabel: 'Prototype kitchen recipe estimate',
                            });
                            setLoggedNote(`Logged "${rec.recipe.name}" cleanly to Today.`);
                            setTimeout(() => setLoggedNote(null), 3000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald/15 hover:bg-emerald/25 text-[11px] font-bold text-forest dark:text-emerald-300"
                        >
                          <Plus className="w-3 h-3" />
                          Log {rec.recipe.name.split(' with ')[0]}
                        </button>
                      ))}
                    </div>
                  )}

                  {showPipelineDetails && msg.pipelineTrace && (
                    <div className="mt-2.5 p-2 rounded-xl bg-forest/5 dark:bg-black/25 text-[10px] space-y-0.5 opacity-80">
                      <div>
                        <strong>Pipeline:</strong> {msg.pipelineTrace.intent} · Lang: {msg.pipelineTrace.detectedLanguage}
                      </div>
                      <div>
                        <strong>Constraints:</strong> {msg.pipelineTrace.constraintsApplied.join(' | ')}
                      </div>
                      <div>
                        <strong>Safety:</strong> {msg.pipelineTrace.safetyChecksPassed.join(' | ')}
                      </div>
                    </div>
                  )}
                </div>

                {msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.actionChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleChip(chip)}
                        className="px-3 py-1 rounded-full border border-emerald/35 bg-emerald/10 text-[11px] font-bold text-forest dark:text-emerald-300 hover:bg-emerald/20"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Conversation Prompts */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-forest/8 dark:border-white/10">
            {quickStarters.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleStarterClick(q)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest/5 dark:bg-white/5 hover:bg-emerald/15 border border-forest/10 dark:border-white/10 text-[11px] font-semibold text-forest/80 dark:text-ivory/80 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-emerald" />
                {q}
              </button>
            ))}
          </div>

          {speechError && (
            <p className="text-[11px] text-amber-700 dark:text-gold">{speechError}</p>
          )}

          {/* Selected photo preview strip with direct OpenCV CLAHE integration */}
          {selectedPhotoPreview && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald/15 via-forest/5 to-emerald/10 border border-emerald/40 shadow-sm animate-fadeIn">
              <div className="relative shrink-0">
                <img
                  src={selectedPhotoPreview}
                  alt="Selected plate"
                  className="w-14 h-14 object-cover rounded-xl border-2 border-emerald shadow-sm"
                />
                <button
                  type="button"
                  onClick={clearSelectedPhoto}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-rose-600"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-forest dark:text-white truncate max-w-[200px]">
                    {selectedPhotoFile?.name || 'Plate photograph attached'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald text-white shadow-xs">
                    ✨ OpenCV CLAHE
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 dark:bg-white/10 text-forest dark:text-ivory">
                    574+ Dishes ML
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  Click Send or ask any question! Runs real-time calorie detection, updates your rings &amp; saves to health vault.
                </p>
              </div>
            </div>
          )}

          {/* Editable Voice / Text / Camera Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Direct Camera / Plate Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-2xl border transition-all shrink-0 flex items-center justify-center ${
                selectedPhotoFile
                  ? 'border-emerald bg-emerald text-white shadow-md shadow-emerald/20 scale-105'
                  : 'border-forest/15 dark:border-white/15 bg-forest/5 dark:bg-white/5 hover:bg-emerald/15 text-emerald hover:scale-105 active:scale-95'
              }`}
              title="Upload plate photo for direct OpenCV CLAHE & 574+ Indian food analysis"
            >
              <Camera className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                selectedPhotoFile
                  ? "Ask about this plate (e.g. 'Is this healthy for dinner?') or click Send to analyze & save..."
                  : "Type, speak, or click 📷 to scan plate — e.g. 'Maine 2 roti khayi'"
              }
              className="flex-1 rounded-2xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-forest dark:text-white focus:outline-none focus:border-emerald"
            />
            <Button type="submit" size="md" rightIcon={<Send className="w-4 h-4" />}>
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
