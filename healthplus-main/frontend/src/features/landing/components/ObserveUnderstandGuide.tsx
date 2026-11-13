import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  Brain,
  Compass,
  Camera,
  TrendingUp,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { SectionAtmosphere } from '@/components/backgrounds/SectionAtmosphere';

export const ObserveUnderstandGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);

  const steps = [
    {
      id: 'observe',
      title: '01. OBSERVE',
      eyebrow: 'Multimodal Input & Confirmation',
      headline: 'Capture the signals behind everyday habits.',
      description:
        'We capture real-world lifestyle data without friction. Computer vision identifies authentic Indian meals with interactive portion scaling, while camera-based pose estimation tracks joint angles during home exercise sessions.',
      icon: <Eye className="w-5 h-5 text-emerald" />,
      tag: 'Stage 1: Observation',
      badgeClass: 'bg-emerald/15 text-emerald dark:bg-emerald/25 dark:text-emerald-light',
      features: [
        { label: 'Indian Food Recognition', desc: 'Pretrained vision with user-confirmed portions' },
        { label: 'Camera Joint Kinematics', desc: '33 landmark angles evaluated client-side' },
        { label: 'Verified Daily Timeline', desc: 'Immutable nutritional snapshots saved to diary' },
      ],
      previewGraphic: (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0A1E17] border border-forest/10 dark:border-white/15 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/8 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-ivory flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald" />
              Context Ingestion
            </span>
            <Badge variant="emerald" size="sm">User Confirmed</Badge>
          </div>
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-sage-soft/60 dark:bg-white/5 flex items-center justify-between text-xs">
              <span className="font-semibold text-forest dark:text-ivory">Kitchen Match: Yellow Moong Dal &amp; Rice</span>
              <span className="font-mono font-bold text-emerald dark:text-emerald-light">IFCT Baseline</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-sage-soft/60 dark:bg-white/5 flex items-center justify-between text-xs">
              <span className="font-semibold text-forest dark:text-ivory">Movement Pace: Guided Squat Set</span>
              <span className="font-mono font-bold text-[#B87A1E] dark:text-gold">2s Control</span>
            </div>
          </div>
          <p className="text-[11px] text-forest/50 dark:text-ivory/50 text-center">
            Zero speculation: All data requires user confirmation before ingestion.
          </p>
        </div>
      ),
    },
    {
      id: 'understand',
      title: '02. UNDERSTAND',
      eyebrow: 'Statistical Baseline Modeling',
      headline: 'Turn everyday activity into meaningful patterns.',
      description:
        'Instead of comparing your body to arbitrary stereotypes, our engine establishes your rolling 7-day and 28-day statistical baselines. We evaluate standard deviations and habit co-occurrences to detect genuine lifestyle shifts.',
      icon: <Brain className="w-5 h-5 text-forest dark:text-gold" />,
      tag: 'Stage 2: Understanding',
      badgeClass: 'bg-forest/15 text-forest dark:bg-gold/20 dark:text-gold',
      features: [
        { label: 'Personal Rolling Baseline', desc: 'Calculates mean and standard deviation for calories & reps' },
        { label: 'Deviation Detection', desc: 'Flags significant habit shifts where |Z| >= 1.75' },
        { label: 'Co-Occurrence Analysis', desc: 'Discovers links between meal timing and workout energy' },
      ],
      previewGraphic: (
        <div className="p-6 rounded-3xl bg-forest dark:bg-[#071914] text-ivory border border-forest-light/40 dark:border-white/15 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-ivory flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gold" />
              Baseline Deviation Engine
            </span>
            <Badge variant="gold" size="sm">Evidence Grounded</Badge>
          </div>
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-ivory">Example Pattern (From Real Logs)</span>
              <span className="font-mono font-bold text-emerald-light">High-Protein Meals</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-ivory">Pantry &amp; Goal Alignment</span>
              <span className="font-mono font-bold text-gold">Always Explained</span>
            </div>
          </div>
          <p className="text-[11px] text-ivory/60 text-center">
            Evidence-backed: Every pattern is anchored in verified multi-day records.
          </p>
        </div>
      ),
    },
    {
      id: 'guide',
      title: '03. GUIDE',
      eyebrow: 'Personalized Adaptive Coaching',
      headline: 'Clear, explainable guidance without generic rules.',
      description:
        'Transform historical insights into daily action. From sub-100ms spoken audio feedback during push-ups to condition-aware Indian diet planning, guidance adapts dynamically to your lifestyle while enforcing strict safety floors.',
      icon: <Compass className="w-5 h-5 text-emerald" />,
      tag: 'Stage 3: Guidance',
      badgeClass: 'bg-emerald/15 text-emerald dark:bg-emerald/25 dark:text-emerald-light',
      features: [
        { label: 'AI Voice Coaching', desc: 'Hindi, Hinglish & English spoken dialogue (Web Speech API)' },
        { label: 'Goal-Aware Indian Meal Engine', desc: 'Allergy/condition safety filters over standardized home recipe portions' },
        { label: 'Explainable Reasoning', desc: 'Clear reasoning showing why each meal or movement fits your constraints' },
      ],
      previewGraphic: (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0A1E17] border border-forest/10 dark:border-white/15 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/8 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-ivory flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald" />
              Real-Time Voice Cue
            </span>
            <Badge variant="emerald" size="sm">Audio Active</Badge>
          </div>
          <div className="p-4 rounded-2xl bg-forest dark:bg-[#081B15] text-ivory text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold block">Illustrative Companion Dialogue</span>
            <p className="font-heading font-extrabold text-sm sm:text-base text-ivory">
              “Paneer excluded tonight — here are 2 quick dal &amp; soya options from what is in your kitchen.”
            </p>
            <span className="text-[10px] text-emerald-light font-mono block">Browser Web Speech API (On-Device)</span>
          </div>
          <p className="text-[11px] text-forest/50 dark:text-ivory/50 text-center">
            Zero cloud round-trip: Voice runs locally via Web Speech API.
          </p>
        </div>
      ),
    },
  ];

  return (
    <section id="observe-understand-guide" className="py-24 relative overflow-hidden isolate">
      <SectionAtmosphere variant="observe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Product Philosophy"
          title="Observe. Understand. Guide."
          subtitle="Three connected stages form our core architecture. We observe what you do, understand how it relates to your personal baseline, and guide you with explainable recommendations."
          align="center"
        />

        {/* 3-Tab Stepper Selector */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/15 gap-1.5">
            {steps.map((st, index) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStep(index as 0 | 1 | 2)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeStep === index
                    ? 'bg-white dark:bg-emerald text-forest dark:text-white shadow-card'
                    : 'text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white'
                }`}
              >
                <span>{st.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Active Step Content */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[activeStep].id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-left"
            >
              {/* Left Column: Narrative & Key Features (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${steps[activeStep].badgeClass}`}>
                  {steps[activeStep].tag}
                </span>

                <h3 className="font-heading font-black text-3xl sm:text-4xl text-forest dark:text-ivory tracking-tight">
                  {steps[activeStep].headline}
                </h3>

                <p className="font-sans text-base text-forest/80 dark:text-ivory/80 leading-relaxed max-w-2xl">
                  {steps[activeStep].description}
                </p>

                <div className="space-y-3 pt-2">
                  {steps[activeStep].features.map((f) => (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald/15 dark:bg-emerald/30 text-emerald dark:text-emerald-light flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-sm text-forest dark:text-ivory">
                          {f.label}:{' '}
                        </span>
                        <span className="font-sans text-xs text-forest/70 dark:text-ivory/70">
                          {f.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Visual HUD Preview (5 cols) */}
              <div className="lg:col-span-5">
                {steps[activeStep].previewGraphic}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
