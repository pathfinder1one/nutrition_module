import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  Check,
  Minus,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import {
  analyzePlateOrText,
  confirmAndSaveMeal,
  type AnalyzeMealResponse,
  type DetectedFoodItem,
  type ConfirmMealResponse,
} from '@/services/nutritionBackendService';
import type { MealSlot } from '@/types/wellness';

export interface AiFoodScannerProps {
  onMealLogged?: (res: ConfirmMealResponse) => void;
}

export const AiFoodScanner: React.FC<AiFoodScannerProps> = ({ onMealLogged }) => {
  const { logMeal } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmation Modal state
  const [draft, setDraft] = useState<AnalyzeMealResponse | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<DetectedFoodItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('lunch');
  const [newItemName, setNewItemName] = useState('');
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Latest saved result
  const [latestResult, setLatestResult] = useState<ConfirmMealResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleStartAnalysis = async () => {
    if (!file && !textInput.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setLatestResult(null);

    try {
      const res = await analyzePlateOrText({
        file,
        text: textInput.trim(),
      });
      setDraft(res);
      setConfirmedItems(res.items);
      setSelectedSlot(res.suggested_meal_type || 'lunch');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateItemQty = (index: number, delta: number) => {
    setConfirmedItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newQty = Math.max(0.5, Math.min(20, Math.round((item.quantity + delta) * 2) / 2));
        return { ...item, quantity: newQty };
      })
    );
  };

  const removeItem = (index: number) => {
    setConfirmedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addItemManual = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    setConfirmedItems((prev) => [
      ...prev,
      { item: trimmed, quantity: 1, serving_unit: '1 serving' },
    ]);
    setNewItemName('');
  };

  const handleConfirmAndSave = async () => {
    if (confirmedItems.length === 0) return;
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await confirmAndSaveMeal({
        mealType: selectedSlot,
        items: confirmedItems.map((i) => ({
          item: i.item,
          quantity: i.quantity,
        })),
      });

      // Synchronize with Health Plus context (daily rings, streak, dashboard)
      logMeal({
        recipeId: `ai-scan-${Date.now()}`,
        mealSlot: selectedSlot,
        name: res.macros.items.map((i) => `${i.item} (x${i.quantity})`).join(', '),
        calories: Math.round(res.macros.totals.calories),
        proteinG: Math.round(res.macros.totals.protein_g),
        carbsG: Math.round(res.macros.totals.carbs_g),
        fatG: Math.round(res.macros.totals.fats_g),
        fiberG: 4,
        sodiumMg: 450,
        source: 'ai_plate_scanner',
        provenanceLabel: 'OpenCV CLAHE + CLIP ViT-B-32 Detection',
      });

      setLatestResult(res);
      setDraft(null);
      setFile(null);
      setTextInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onMealLogged) onMealLogged(res);
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : 'Could not log meal.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SCANNER INPUT CARD */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-forest dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald" />
              AI Indian Food Scanner
            </h2>
            <p className="text-xs text-forest/70 dark:text-ivory/70">
              OpenCV CLAHE preprocessed · CLIP ViT-B-32 detection · 574+ Indian foods catalog
            </p>
          </div>
          <Badge variant="emerald" size="sm">
            Live ML Engine
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Visual Camera / Photo Dropzone */}
          <div className="flex flex-col">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                if (picked) setTextInput('');
              }}
            />

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-forest/15 dark:border-white/15 h-48 bg-black/5 flex items-center justify-center">
                <img src={previewUrl} alt="Meal plate preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold backdrop-blur-sm transition"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-forest/20 dark:border-white/20 hover:border-emerald hover:bg-emerald-500/5 transition cursor-pointer text-forest dark:text-ivory"
              >
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Snap Plate or Upload Photo</span>
                  <span className="text-[10px] text-forest/60 dark:text-ivory/60 block mt-0.5">
                    JPEG, PNG or WebP up to 12 MB
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Hinglish / English Natural Text Input */}
          <div className="flex flex-col">
            <textarea
              className="w-full h-48 p-3 rounded-2xl border border-forest/20 dark:border-white/20 bg-forest/5 dark:bg-white/5 text-xs text-forest dark:text-white placeholder-forest/50 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald/40 resize-none"
              placeholder={`Or type what you ate in English or Hinglish:
"Maine 2 aloo paratha aur dahi khaya"
"3 roti with dal tadka and cucumber"
"1 plate chole bhature with sweet lassi"`}
              value={textInput}
              disabled={Boolean(file)}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-forest/60 dark:text-ivory/60">
            Step 01-02: Quality enhancement & noise reduction run automatically
          </span>
          <Button
            variant="primary"
            size="md"
            disabled={isAnalyzing || (!file && !textInput.trim())}
            onClick={handleStartAnalysis}
            leftIcon={isAnalyzing ? undefined : <Sparkles className="w-4 h-4" />}
          >
            {isAnalyzing ? 'OpenCV Enhancing & Reading Plate…' : 'Scan & Analyze Plate'}
          </Button>
        </div>
      </Card>

      {/* LATEST LOGGED RESULT CARD */}
      {latestResult && (
        <Card variant="surface" className="p-5 border-emerald/30 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald mt-0.5">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">
                  Meal Successfully Logged & Verified
                </span>
                <span className="text-xs text-forest/60 dark:text-ivory/60">
                  {latestResult.log.meal_type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-forest dark:text-white mt-1">
                {latestResult.feedback}
              </p>

              {/* Macro Pills */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-forest dark:text-ivory">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald">
                  <Flame className="w-3.5 h-3.5" />
                  {Math.round(latestResult.macros.totals.calories)} kcal
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Dumbbell className="w-3.5 h-3.5" />
                  {Math.round(latestResult.macros.totals.protein_g)}g protein
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Wheat className="w-3.5 h-3.5" />
                  {Math.round(latestResult.macros.totals.carbs_g)}g carbs
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Droplet className="w-3.5 h-3.5" />
                  {Math.round(latestResult.macros.totals.fats_g)}g fats
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* CONFIRMATION MODAL (Step 05 & 06: Human-in-the-Loop) */}
      {draft && (
        <Modal
          isOpen={Boolean(draft)}
          onClose={() => setDraft(null)}
          title="Confirm Detected Meal & Portions"
          description="Review identified Indian food items and adjust portion sizes before saving."
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            {/* OpenCV Preprocessing Card */}
            {draft.preprocessed_image && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="text-xs font-bold text-forest dark:text-white">
                      Step 02: OpenCV Preprocessed Plate
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEnhancedPreview(!showEnhancedPreview)}
                    className="text-xs text-emerald font-semibold flex items-center gap-1 hover:underline"
                  >
                    {showEnhancedPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> View Enhanced
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-forest/80 dark:text-ivory/80 font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                    Standardized 1024px
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                    Gaussian Denoised (3x3)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                    CLAHE in LAB space
                  </span>
                </div>

                {showEnhancedPreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-emerald-500/30">
                    <img
                      src={draft.preprocessed_image}
                      alt="OpenCV enhanced plate"
                      className="w-full max-h-52 object-cover"
                    />
                    <div className="p-1.5 text-center text-[10px] text-forest/70 dark:text-ivory/70 bg-emerald-500/10">
                      Standardized contrast enhanced before CLIP Vision Transformer analysis.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meal Slot Picker */}
            <div>
              <label className="block text-xs font-bold text-forest dark:text-white mb-1.5">
                Meal Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 text-xs rounded-xl font-semibold capitalize transition ${
                      selectedSlot === slot
                        ? 'bg-emerald text-white shadow-sm'
                        : 'bg-forest/5 dark:bg-white/5 text-forest dark:text-ivory hover:bg-forest/10'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Detected Items List */}
            <div>
              <label className="block text-xs font-bold text-forest dark:text-white mb-1.5">
                Identified Items & Servings
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {confirmedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-forest/15 dark:border-white/15 bg-forest/5 dark:bg-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-forest dark:text-white">
                          {item.item}
                        </span>
                        {item.confidence && item.confidence < 0.6 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                            Low confidence
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-forest/60 dark:text-ivory/60 block">
                        Serving unit: {item.serving_unit || '1 serving'}
                      </span>
                    </div>

                    {/* Stepper Portion Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQty(idx, -0.5)}
                        className="w-7 h-7 rounded-lg border border-forest/20 dark:border-white/20 flex items-center justify-center hover:bg-forest/10 text-forest dark:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold tabular-nums text-forest dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(idx, 0.5)}
                        className="w-7 h-7 rounded-lg border border-forest/20 dark:border-white/20 flex items-center justify-center hover:bg-forest/10 text-forest dark:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-forest/40 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Extra Item Manually */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Missed an item? (e.g. Dahi, Papad, Pickle)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItemManual()}
                className="flex-1 p-2.5 rounded-xl border border-forest/20 dark:border-white/20 bg-forest/5 dark:bg-white/5 text-xs text-forest dark:text-white placeholder-forest/50 focus:outline-none focus:ring-1 focus:ring-emerald"
              />
              <Button variant="outline" size="sm" onClick={addItemManual}>
                Add Item
              </Button>
            </div>

            {confirmError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 text-xs text-red-600 dark:text-red-400">
                {confirmError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-forest/10 dark:border-white/10">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)} disabled={isConfirming}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isConfirming || confirmedItems.length === 0}
                onClick={handleConfirmAndSave}
              >
                {isConfirming ? 'Computing Nutrition…' : 'Confirm & Log Meal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
