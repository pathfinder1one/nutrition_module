import React, { useState } from 'react';
import { Utensils, Activity, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SectionAtmosphere } from '@/components/backgrounds';

export interface FeaturePreviewsSectionProps {
  onNavigate?: (path: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    id: 'pantry',
    userLabel: 'Hinglish Kitchen',
    userText: '"Paneer ghar par nahi hai — bas dal aur dahi hai."',
    aiReply:
      'Paneer options excluded across Dinner & Food Hub. Suggesting **Dal Tadka & Brown Rice** (~362 kcal, ~14g protein · prototype est.) + **Curd tempering** from your kitchen.',
    tag: 'Remembers unavailable ingredient',
  },
  {
    id: 'move',
    userLabel: 'Home Movement',
    userText: '"Aaj gym nahi ja sakti — I only have ten minutes, no dumbbells."',
    aiReply:
      'Stays in Hinglish: Ready! **10-min bodyweight circuit** (Squats, Wall Push-ups, Glute Bridges · 2 calm rounds × 8–10 slow reps). No equipment needed.',
    tag: 'Sticky Hinglish + no-equipment adapt',
  },
  {
    id: 'safety',
    userLabel: 'Safety Guardrail',
    userText: '"What dose of insulin or tablet should I take?"',
    aiReply:
      'HEALTH PLUS is a personal wellness companion, not a diagnostic tool — it never suggests or adjusts medication dosages. Please consult your physician for dosage questions.',
    tag: 'Non-diagnostic clinical boundary',
  },
];

const COMPACT_FEATURES = [
  {
    badge: 'Prototype Recipe Baseline',
    title: 'Food That Fits Your Kitchen',
    desc: 'Everyday Indian dishes matched to your dietary preferences, budget, allergies, and whatever ingredients are actually at home today.',
    highlights: ['Allergy & gluten guardrails', 'Real pantry updates', 'Instant "Don\'t have" swaps'],
    icon: <Utensils className="w-5 h-5 text-emerald" />,
  },
  {
    badge: 'Guided Human Form',
    title: 'Calm Move Studio',
    desc: 'Anatomical human posture demonstrations with simple Hinglish, Hindi, or English voice cues — plus optional on-device camera mirror.',
    highlights: ['Solid human rep animation', 'Slow form-first pacing', '100% browser privacy'],
    icon: <Activity className="w-5 h-5 text-emerald" />,
  },
  {
    badge: 'Connected Memory',
    title: 'One Personal Companion',
    desc: 'Instead of repeating yourself across separate tabs, what you share during onboarding and chat shapes Today, Food, Move, and Progress together.',
    highlights: ['Hindi, Hinglish & English voice', 'Multi-turn ingredient memory', 'Non-diagnostic boundaries'],
    icon: <Bot className="w-5 h-5 text-gold" />,
  },
];

export const FeaturePreviewsSection: React.FC<FeaturePreviewsSectionProps> = ({
  onNavigate = () => {},
}) => {
  const [selectedDemoId, setSelectedDemoId] = useState<string>(SAMPLE_PROMPTS[0].id);
  const activeDemo =
    SAMPLE_PROMPTS.find((item) => item.id === selectedDemoId) ?? SAMPLE_PROMPTS[0];

  return (
    <section id="features" className="py-20 relative overflow-hidden isolate">
      <SectionAtmosphere variant="observe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        <SectionHeading
          badge="Connected Experience"
          title="One quiet companion, built around real Indian daily life."
          subtitle="Start with a short AI personal interview, and every part of the app — Today, Food, Move, AI Coach, and Progress — adapts together."
          align="center"
        />

        {/* Concise Interactive AI Companion Demonstration */}
        <div className="mt-8 max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-[#0A1E17]/90 backdrop-blur-xl border border-emerald/25 dark:border-emerald/30 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald" />
              <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-300">
                Interactive Companion Preview
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => setSelectedDemoId(demo.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    selectedDemoId === demo.id
                      ? 'bg-emerald text-white border-emerald'
                      : 'bg-forest/5 dark:bg-white/5 border-forest/15 dark:border-white/15 text-forest dark:text-ivory hover:bg-forest/10'
                  }`}
                >
                  {demo.userLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-forest text-white">
              <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold mb-1">
                You ask naturally
              </p>
              <p className="font-medium leading-relaxed">{activeDemo.userText}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-forest/6 dark:bg-white/6 border border-forest/10 dark:border-white/10 text-forest dark:text-ivory">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-emerald dark:text-emerald-300 font-bold">
                  Companion Response
                </span>
                <span className="text-[10px] font-semibold text-forest/65 dark:text-ivory/65">
                  {activeDemo.tag}
                </span>
              </div>
              <p className="leading-relaxed">{activeDemo.aiReply.replace(/\*\*/g, '')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMPACT_FEATURES.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-3xl bg-white/85 dark:bg-[#0A1E17]/90 backdrop-blur-xl border border-forest/10 dark:border-white/10 shadow-card flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <Badge variant="emerald" size="sm">
                    {item.badge}
                  </Badge>
                </div>

                <h3 className="font-heading font-bold text-lg text-forest dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-forest/75 dark:text-ivory/75 leading-relaxed">
                  {item.desc}
                </p>

                <ul className="space-y-1.5 pt-1 text-xs text-forest/70 dark:text-ivory/70">
                  {item.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-forest/8 dark:border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('/signup')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Start Personal Setup
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
