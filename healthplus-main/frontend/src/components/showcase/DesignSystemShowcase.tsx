import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Flame,
  Activity,
  Heart,
  ShieldCheck,
  Check,
  ArrowRight,
  Maximize2,
  Copy,
  Layers,
  Type,
  MoreVertical,
  HelpCircle,
  Trash2,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { motionVariants } from '@/design-system/motion';
import { AmbientBackground, type BackgroundVariant } from '@/components/backgrounds/AmbientBackground';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  IconButton,
} from '@/components/ui/Button';
import {
  Card,
  GlassCard,
  FeatureCard,
  StatCard,
  InsightCard,
  InteractiveCard,
} from '@/components/ui/Card';
import {
  TextInput,
  PasswordInput,
  SelectInput,
  TextArea,
  Checkbox,
  Toggle,
} from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Tooltip } from '@/components/ui/Tooltip';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const DesignSystemShowcase: React.FC = () => {
  // Interactive state
  const [activeBgVariant, setActiveBgVariant] = useState<BackgroundVariant>('wellness');
  const [bgIntensity, setBgIntensity] = useState<'subtle' | 'medium' | 'vibrant'>('medium');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [toggleState, setToggleState] = useState(true);
  const [checkboxState, setCheckboxState] = useState(true);
  const [sliderProgress, setSliderProgress] = useState(68);
  const [selectedCard, setSelectedCard] = useState<'a' | 'b'>('a');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const colorSwatches = [
    {
      name: 'Deep Forest Green',
      token: '--color-forest',
      hex: '#123B32',
      role: 'Primary dark surface, luxury grounding, authoritative headings',
      contrast: '11.4:1 (WCAG AAA)',
      textColor: 'text-ivory',
      bgColor: 'bg-[#123B32]',
    },
    {
      name: 'Emerald',
      token: '--color-emerald',
      hex: '#187A5B',
      role: 'Primary interactive trigger, active states, kinetic pulse',
      contrast: '4.8:1 (WCAG AA)',
      textColor: 'text-white',
      bgColor: 'bg-[#187A5B]',
    },
    {
      name: 'Sage',
      token: '--color-sage',
      hex: '#DDECE3',
      role: 'Muted chip backgrounds, soft borders, quiet surfaces',
      contrast: 'Subtle Tint',
      textColor: 'text-forest',
      bgColor: 'bg-[#DDECE3]',
    },
    {
      name: 'Warm Ivory',
      token: '--color-ivory',
      hex: '#FAF9F5',
      role: 'Primary canvas background, card surface, warm breathing room',
      contrast: 'Base Canvas',
      textColor: 'text-forest',
      bgColor: 'bg-[#FAF9F5] border border-forest/10',
    },
    {
      name: 'Gold Accent',
      token: '--color-gold',
      hex: '#E7B76B',
      role: 'Energy metrics, active streaks, celebratory highlights',
      contrast: 'Accent Glow',
      textColor: 'text-forest-dark font-bold',
      bgColor: 'bg-[#E7B76B]',
    },
  ];

  return (
    <AmbientBackground variant={activeBgVariant} intensity={bgIntensity} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-forest/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald animate-ping" />
              <Badge variant="emerald" size="sm">
                PHASE 1 FOUNDATION PREVIEW
              </Badge>
              <Badge variant="gold" size="sm">
                SAMPLE DATA ONLY
              </Badge>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-forest tracking-tight">
              Design System Showcase
            </h1>
            <p className="text-forest/70 text-base mt-2 max-w-2xl font-sans">
              Comprehensive interactive catalog of centralized tokens, multi-layered background animations,
              accessible UI components, and kinetic motion presets for HEALTH PLUS.
            </p>
          </div>

          {/* Interactive Background Controller */}
          <div className="p-4 rounded-2xl glass-surface flex flex-col gap-3 shrink-0 shadow-subtle border border-forest/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest/75">
              <Layers className="w-4 h-4 text-emerald" />
              <span>Live Background Variant</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['wellness', 'forest', 'intelligence', 'orbital'] as BackgroundVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setActiveBgVariant(v)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all select-none',
                    activeBgVariant === v
                      ? 'bg-forest text-ivory shadow-sm'
                      : 'bg-white/80 text-forest/75 hover:bg-white hover:text-forest'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-forest/10 text-xs">
              <span className="text-forest/60">Intensity:</span>
              <div className="flex gap-1.5">
                {(['subtle', 'medium', 'vibrant'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setBgIntensity(lvl)}
                    className={cn(
                      'px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize transition-colors',
                      bgIntensity === lvl ? 'bg-emerald text-white' : 'text-forest/60 hover:text-forest'
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: BRAND IDENTITY & PALETTE
        ========================================================================= */}
        <section id="brand-identity" className="space-y-8">
          <SectionHeading
            badge="Section 01"
            title="Brand Identity & Master Color Tokens"
            subtitle="Centralized design foundation uniting deep natural forest tones with clinical high-tech precision."
            align="left"
          />

          {/* Logo Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" className="flex items-center justify-between p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-forest flex items-center justify-center shadow-lg shadow-forest/20">
                  <span className="font-heading font-black text-3xl text-gold">H+</span>
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-forest tracking-tight">
                    HEALTH PLUS
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald mt-0.5">
                    Observe. Understand. Guide.
                  </p>
                  <p className="text-xs text-forest/50 mt-1">CASA Vital Personal Wellness</p>
                </div>
              </div>
              <Badge variant="forest">Primary Lockup</Badge>
            </Card>

            <Card variant="dark" className="flex items-center justify-between p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald/20 border border-emerald/40 flex items-center justify-center shadow-glow-emerald">
                  <span className="font-heading font-black text-3xl text-gold">H+</span>
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-ivory tracking-tight">
                    HEALTH PLUS
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-light mt-0.5">
                    Dark Surface Variant
                  </p>
                </div>
              </div>
              <Badge variant="gold">Contrast Inverted</Badge>
            </Card>
          </div>

          {/* Palette Swatches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {colorSwatches.map((color) => (
              <div
                key={color.hex}
                onClick={() => copyToClipboard(color.hex)}
                className="group p-5 rounded-2xl bg-white border border-forest/10 shadow-subtle hover:shadow-card transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div
                    className={cn(
                      'w-full h-24 rounded-xl flex items-end justify-between p-3 mb-3 shadow-inner transition-transform group-hover:scale-[1.02]',
                      color.bgColor
                    )}
                  >
                    <span className={cn('text-xs font-mono font-semibold', color.textColor)}>
                      {color.hex}
                    </span>
                    <button
                      type="button"
                      aria-label={`Copy ${color.name} hex code`}
                      className="p-1 rounded bg-black/20 text-white/80 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-forest">{color.name}</h4>
                  <p className="text-[11px] font-mono text-emerald mt-0.5">{color.token}</p>
                  <p className="text-xs text-forest/70 mt-2 leading-relaxed">{color.role}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-forest/8 flex items-center justify-between text-[11px]">
                  <span className="text-forest/50">Contrast</span>
                  <span className="font-semibold text-forest/80">{color.contrast}</span>
                </div>
              </div>
            ))}
          </div>
          {copiedHex && (
            <p className="text-xs font-semibold text-emerald text-center animate-fadeIn">
              ✓ Copied {copiedHex} to clipboard!
            </p>
          )}

          {/* Typography Hierarchy */}
          <Card variant="surface" className="p-8 space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest/75 mb-2">
              <Type className="w-4 h-4 text-emerald" />
              <span>Typographic Hierarchy (Manrope & Inter)</span>
            </div>
            <div className="space-y-4">
              <div className="pb-4 border-b border-forest/8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Display Hero</span>
                <span className="font-heading font-extrabold text-4xl sm:text-5xl text-forest tracking-tight">
                  Observe. Understand. Guide.
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">64px / Manrope 800</span>
              </div>
              <div className="pb-4 border-b border-forest/8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Heading 1</span>
                <span className="font-heading font-bold text-3xl text-forest tracking-tight">
                  Health Pattern Intelligence
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">36px / Manrope 700</span>
              </div>
              <div className="pb-4 border-b border-forest/8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Heading 2</span>
                <span className="font-heading font-bold text-2xl text-forest">
                  Daily Nutrition Summary
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">28px / Manrope 700</span>
              </div>
              <div className="pb-4 border-b border-forest/8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Heading 3</span>
                <span className="font-heading font-semibold text-xl text-forest">
                  Personalized Weekly Diet Plan
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">20px / Manrope 600</span>
              </div>
              <div className="pb-4 border-b border-forest/8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Body Regular</span>
                <span className="font-sans text-base text-forest/80 max-w-xl">
                  Health Plus connects your user-confirmed nutrition logs and camera-assisted workouts to
                  discover non-obvious correlations over multi-week periods.
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">16px / Inter 400</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-xs font-mono text-forest/50 w-28 shrink-0">Tabular Metric</span>
                <span className="font-sans font-extrabold text-2xl text-forest tabular-nums">
                  2,450 kcal • 118.5g Protein • 94.2% Accuracy
                </span>
                <span className="text-xs font-mono text-emerald shrink-0">Inter Tabular</span>
              </div>
            </div>
          </Card>
        </section>

        {/* =========================================================================
            SECTION 2: ANIMATED BACKGROUND COMPARISON
        ========================================================================= */}
        <section id="backgrounds" className="space-y-8">
          <SectionHeading
            badge="Section 02"
            title="Animated Background Engine"
            subtitle="Four distinctive, multi-layered, GPU-accelerated background treatments designed for varied mental states."
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              variant="elevated"
              className="p-6 overflow-hidden relative min-h-[260px] flex flex-col justify-between"
            >
              <AmbientBackground variant="forest" className="absolute inset-0 -z-10" />
              <div>
                <Badge variant="forest">Variant A: Forest</Badge>
                <h4 className="font-heading font-bold text-xl text-ivory mt-3">
                  Deep Forest & Emerald Glow
                </h4>
                <p className="text-xs text-ivory/80 mt-1 max-w-sm">
                  Used for hero focal moments, exercise canvas framing, and high-impact highlights.
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setActiveBgVariant('forest')}
                className="w-fit"
              >
                Set as Active Canvas
              </Button>
            </Card>

            <Card
              variant="elevated"
              className="p-6 overflow-hidden relative min-h-[260px] flex flex-col justify-between"
            >
              <AmbientBackground variant="wellness" className="absolute inset-0 -z-10" />
              <div>
                <Badge variant="sage">Variant B: Wellness</Badge>
                <h4 className="font-heading font-bold text-xl text-forest mt-3">
                  Warm Ivory & Sage Gradients
                </h4>
                <p className="text-xs text-forest/70 mt-1 max-w-sm">
                  The primary calming background for dashboard cards, diary timelines, and diet planners.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveBgVariant('wellness')}
                className="w-fit"
              >
                Set as Active Canvas
              </Button>
            </Card>

            <Card
              variant="elevated"
              className="p-6 overflow-hidden relative min-h-[260px] flex flex-col justify-between"
            >
              <AmbientBackground variant="intelligence" className="absolute inset-0 -z-10" />
              <div>
                <Badge variant="emerald">Variant C: Intelligence</Badge>
                <h4 className="font-heading font-bold text-xl text-ivory mt-3">
                  Synaptic Net & Glowing Nodes
                </h4>
                <p className="text-xs text-ivory/80 mt-1 max-w-sm">
                  Used for the Health Pattern Intelligence engine to visualize connections between habits.
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setActiveBgVariant('intelligence')}
                className="w-fit"
              >
                Set as Active Canvas
              </Button>
            </Card>

            <Card
              variant="elevated"
              className="p-6 overflow-hidden relative min-h-[260px] flex flex-col justify-between"
            >
              <AmbientBackground variant="orbital" className="absolute inset-0 -z-10" />
              <div>
                <Badge variant="gold">Variant D: Orbital</Badge>
                <h4 className="font-heading font-bold text-xl text-forest mt-3">
                  Concentric Translucent Rings
                </h4>
                <p className="text-xs text-forest/70 mt-1 max-w-sm">
                  Used for the 3D-feeling landing hero showcase and milestone celebration states.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveBgVariant('orbital')}
                className="w-fit"
              >
                Set as Active Canvas
              </Button>
            </Card>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: BUTTONS
        ========================================================================= */}
        <section id="buttons" className="space-y-8">
          <SectionHeading
            badge="Section 03"
            title="Buttons & Interactive Triggers"
            subtitle="Pill-shaped, haptic-feeling buttons with responsive hover lifts and loading state spinners."
            align="left"
          />

          <Card variant="glass" className="p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-forest/10">
              <span className="text-xs font-bold uppercase tracking-wider text-forest/75">
                Button Styles & Sizes
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setButtonLoading(!buttonLoading)}
              >
                Toggle Loading States ({buttonLoading ? 'ON' : 'OFF'})
              </Button>
            </div>

            {/* Standard Variants */}
            <div className="flex flex-wrap items-center gap-4">
              <PrimaryButton isLoading={buttonLoading}>Primary Button</PrimaryButton>
              <SecondaryButton isLoading={buttonLoading}>Secondary Button</SecondaryButton>
              <Button variant="gold" isLoading={buttonLoading}>
                Gold Highlight
              </Button>
              <OutlineButton isLoading={buttonLoading}>Outline Button</OutlineButton>
              <GhostButton isLoading={buttonLoading}>Ghost Button</GhostButton>
              <Button variant="danger" isLoading={buttonLoading}>
                Danger Action
              </Button>
              <PrimaryButton disabled>Disabled Button</PrimaryButton>
            </div>

            {/* Sizes & Icons */}
            <div className="pt-6 border-t border-forest/8 flex flex-wrap items-center gap-4">
              <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                Small Button
              </Button>
              <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Medium Button
              </Button>
              <Button size="lg" leftIcon={<Flame className="w-5 h-5 text-gold" />}>
                Large CTA Button
              </Button>
              <IconButton icon={<Heart className="w-4 h-4 text-status-danger" />} aria-label="Favorite" />
              <IconButton icon={<Activity className="w-4 h-4 text-emerald" />} aria-label="Activity" />
              <IconButton icon={<ShieldCheck className="w-4 h-4" />} aria-label="Security" />
            </div>
          </Card>
        </section>

        {/* =========================================================================
            SECTION 4: CARDS
        ========================================================================= */}
        <section id="cards" className="space-y-8">
          <SectionHeading
            badge="Section 04"
            title="Card Hierarchy & Surfaces"
            subtitle="Diverse, purpose-built card containers maintaining unified radii, subtle borders, and soft shadows."
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* StatCard */}
            <StatCard
              label="Daily Protein Intake (Sample)"
              value="118.5"
              unit="grams"
              delta={{ value: "+14.2g vs. baseline", isPositive: true, period: "past 7 days" }}
              icon={<Activity className="w-5 h-5" />}
            />

            {/* StatCard Calorie */}
            <StatCard
              label="Active Calories Burned (Sample)"
              value="480"
              unit="kcal"
              delta={{ value: "+65 kcal", isPositive: true, period: "today" }}
              icon={<Flame className="w-5 h-5 text-gold" />}
            />

            {/* Interactive Selectable Card */}
            <InteractiveCard
              selected={selectedCard === 'a'}
              onClick={() => setSelectedCard('a')}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest/70">
                    Dietary Plan Option A
                  </span>
                  {selectedCard === 'a' && <Check className="w-4 h-4 text-emerald" />}
                </div>
                <h4 className="font-heading font-bold text-base text-forest">High-Protein Vegetarian</h4>
                <p className="text-xs text-forest/70 mt-1">
                  130g protein target utilizing lentils, paneer, and Greek curd. Strict peanut exclusion.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald mt-4">Selected Tier</span>
            </InteractiveCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FeatureCard */}
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              badge="Module 5"
              title="Plate Portion Estimator (Prototype)"
              description="Attach a meal photo for your local visual diary and estimate Indian home portions with transparent nutrition notes."
              actionText="Preview Estimator Flow"
              onAction={() => setIsModalOpen(true)}
            />

            {/* InsightCard */}
            <InsightCard
              category="Consistency"
              confidenceScore={0.92}
              headline="Elevated Protein Intake on Workout Days (Sample)"
              explanation="Your confirmed records show an average of 114g protein on days when squats were completed, compared to 76g on rest days."
              evidenceCount={8}
              onViewEvidence={() => alert('Viewing evidence records for sample insight.')}
            />

            {/* GlassCard Showcase */}
            <GlassCard className="p-6 flex flex-col justify-between">
              <div>
                <Badge variant="sage">GlassCard Surface</Badge>
                <h4 className="font-heading font-bold text-lg text-forest mt-3">
                  Translucent Backdrop Blur
                </h4>
                <p className="text-xs text-forest/75 mt-2 leading-relaxed">
                  Backdrop-filtered surface allowing underlying animated orbs to subtly shine through while preserving high text contrast.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-emerald">
                <span>Adaptive Blur (14px)</span>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: FORM ELEMENTS & CONTROLS
        ========================================================================= */}
        <section id="form-elements" className="space-y-8">
          <SectionHeading
            badge="Section 05"
            title="Form Inputs & Data Controls"
            subtitle="Accessible inputs with validation errors, password reveals, custom dropdowns, and toggles."
            align="left"
          />

          <Card variant="glass" className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TextInput
                label="Full Name"
                placeholder="e.g. Member Name"
                helperText="Enter your preferred display name"
              />

              <PasswordInput
                label="Password"
                placeholder="Enter secure password"
                helperText="Minimum 8 characters with numbers"
              />

              <TextInput
                label="Daily Calorie Floor (Validation Error)"
                defaultValue="950"
                error="Value is below safe metabolic floor of 1200 kcal"
              />

              <SelectInput
                label="Primary Dietary Style"
                options={[
                  { label: 'Vegetarian (Lacto-Vegetarian)', value: 'veg' },
                  { label: 'Vegan (100% Plant-Based)', value: 'vegan' },
                  { label: 'Eggetarian (Ovo-Vegetarian)', value: 'egg' },
                  { label: 'Non-Vegetarian', value: 'non_veg' },
                  { label: 'Jain (Strict Root Vegetable Exclusion)', value: 'jain' },
                ]}
              />

              <div className="space-y-4 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-forest/75 block">
                  Interactive Toggles
                </span>
                <Toggle
                  checked={toggleState}
                  onChange={setToggleState}
                  label="Adaptive Voice Coaching"
                  description="Spoken posture cues during squats"
                />
              </div>

              <div className="space-y-4 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-forest/75 block">
                  Checkboxes
                </span>
                <Checkbox
                  checked={checkboxState}
                  onChange={(e) => setCheckboxState(e.target.checked)}
                  label="Strict Allergy Enforcement"
                  description="Exclude peanuts and shellfish from diet plans"
                />
              </div>

              <div className="col-span-full">
                <TextArea
                  label="Allergy & Food Dislike Notes"
                  placeholder="e.g. Dislike bitter gourd; allergic to walnuts and tree nuts."
                  helperText="All recorded allergens will be strictly excluded from recommended weekly meal plans."
                />
              </div>
            </div>
          </Card>
        </section>

        {/* =========================================================================
            SECTION 6: PROGRESS VISUALIZATIONS & METRICS
        ========================================================================= */}
        <section id="visualizations" className="space-y-8">
          <SectionHeading
            badge="Section 06"
            title="Progress Visualizations & Meters"
            subtitle="Radial rings, macro proportion bars, and streak counters."
            align="left"
          />

          <Card variant="glass" className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Radial Progress Ring */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/60 border border-forest/8">
                <ProgressRing
                  progress={sliderProgress}
                  size={150}
                  strokeWidth={12}
                  color="emerald"
                  label="Calorie Target"
                  valueText={`${Math.round((sliderProgress / 100) * 2400)} kcal`}
                />
                <div className="w-full mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-forest/70">
                    <span>Adjust Interactive Meter:</span>
                    <span className="font-bold">{sliderProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={sliderProgress}
                    onChange={(e) => setSliderProgress(Number(e.target.value))}
                    className="w-full accent-emerald cursor-pointer"
                  />
                </div>
              </div>

              {/* Linear Progress Bars (Macros) */}
              <div className="md:col-span-2 space-y-5 p-6 rounded-2xl bg-white/60 border border-forest/8">
                <h4 className="font-heading font-bold text-base text-forest mb-2">
                  Daily Macronutrient Distribution (Sample)
                </h4>
                <ProgressBar
                  progress={sliderProgress}
                  color="emerald"
                  label="Protein Adherence"
                  valueText={`${Math.round((sliderProgress / 100) * 130)}g / 130g`}
                />
                <ProgressBar
                  progress={Math.min(sliderProgress + 15, 100)}
                  color="gold"
                  label="Complex Carbohydrates"
                  valueText="220g / 260g"
                />
                <ProgressBar
                  progress={Math.max(sliderProgress - 20, 25)}
                  color="forest"
                  label="Healthy Fats"
                  valueText="48g / 65g"
                />

                <div className="pt-4 flex flex-wrap gap-2">
                  <Badge variant="emerald">Protein: 28%</Badge>
                  <Badge variant="gold">Carbs: 52%</Badge>
                  <Badge variant="sage">Fats: 20%</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* =========================================================================
            SECTION 7: MOTION, MODALS, TOOLTIPS & DROPDOWNS
        ========================================================================= */}
        <section id="motion-demo" className="space-y-8">
          <SectionHeading
            badge="Section 07"
            title="Motion Demonstrations, Modals & Micro-Interactions"
            subtitle="Spring-driven staggered entrances, accessible dialogs, tooltips, and action dropdowns."
            align="left"
          />

          <Card variant="glass" className="p-8 space-y-8">
            {/* Modal & Popover Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-forest/10">
              <div className="flex items-center gap-4">
                <Avatar name="Member Profile" size="lg" />
                <div>
                  <h4 className="font-heading font-bold text-lg text-forest">
                    Interactive Overlay Triggers
                  </h4>
                  <p className="text-xs text-forest/70">
                    Test accessible modal dialog, tooltips, and dropdown menus.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tooltip trigger */}
                <Tooltip content="Mifflin-St Jeor formula validated calculation" position="top">
                  <Button variant="outline" size="sm" leftIcon={<HelpCircle className="w-3.5 h-3.5" />}>
                    Hover For Tooltip
                  </Button>
                </Tooltip>

                {/* Dropdown Menu trigger */}
                <Dropdown
                  trigger={
                    <Button variant="secondary" size="sm" rightIcon={<MoreVertical className="w-3.5 h-3.5" />}>
                      Action Menu
                    </Button>
                  }
                  items={[
                    {
                      id: 'export',
                      label: 'Export Health Records (JSON)',
                      icon: <ShieldCheck className="w-4 h-4 text-emerald" />,
                      onClick: () => alert('Sample Export Triggered'),
                    },
                    {
                      id: 'settings',
                      label: 'Profile Preferences',
                      icon: <Settings className="w-4 h-4 text-forest" />,
                      onClick: () => alert('Settings Triggered'),
                    },
                    {
                      id: 'delete',
                      label: 'Delete Stored Telemetry',
                      icon: <Trash2 className="w-4 h-4 text-status-danger" />,
                      danger: true,
                      onClick: () => alert('Delete Triggered'),
                    },
                  ]}
                />

                {/* Modal Trigger */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Maximize2 className="w-4 h-4" />}
                >
                  Open Modal
                </Button>
              </div>
            </div>

            {/* Staggered Container Demonstration */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest/75 block mb-4">
                Staggered Children Reveal (Hover for Lift)
              </span>
              <motion.div
                variants={motionVariants.staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {[
                  { title: 'Observe', desc: 'Confirm food & reps' },
                  { title: 'Understand', desc: 'Rolling baselines' },
                  { title: 'Guide', desc: 'Actionable wellness' },
                  { title: 'Sovereignty', desc: 'Private & exportable' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={motionVariants.staggerItem}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="p-4 rounded-xl bg-white border border-forest/8 shadow-subtle flex flex-col justify-between"
                  >
                    <span className="text-xs font-mono font-bold text-emerald">0{idx + 1}</span>
                    <div className="mt-3">
                      <h5 className="font-heading font-bold text-sm text-forest">{item.title}</h5>
                      <p className="text-xs text-forest/60 mt-1">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Skeletons, Empty States & Error States */}
            <div className="pt-6 border-t border-forest/8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-forest/75 block">
                  Loading Skeleton (CLS = 0)
                </span>
                <div className="p-4 rounded-2xl bg-white border border-forest/8 space-y-3">
                  <div className="flex items-center gap-3">
                    <LoadingSkeleton variant="circular" className="w-10 h-10" />
                    <div className="space-y-1.5 flex-1">
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <LoadingSkeleton className="h-16 w-full" />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest/75 block mb-3">
                  Empty State Pattern
                </span>
                <EmptyState
                  title="No meals logged yet today"
                  description="Open Food Hub when you are ready to log breakfast."
                  actionText="Open Modal Preview"
                  onAction={() => setIsModalOpen(true)}
                  className="py-5"
                />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest/75 block mb-3">
                  Error State Pattern
                </span>
                <ErrorState
                  title="Camera permission needed"
                  message="Enable camera access in your browser settings to track squat posture."
                  onRetry={() => alert('Retrying permission check')}
                  className="py-5"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Modal Dialog Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="HEALTH PLUS Modal Preview"
          description="Accessible, keyboard-navigable dialog with Framer Motion spring physics."
        >
          <div className="space-y-4 my-4 text-sm text-forest/80 leading-relaxed">
            <p>
              This modal demonstrates the standard dialog container used across the application for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Food Scanner confirmation & portion adjustment stepper</li>
              <li>Diet Planner "Swap Meal" ingredient alternative selector</li>
              <li>Post-workout kinematic summary & form score report</li>
              <li>Privacy consent toggles & account deletion confirmation</li>
            </ul>
            <div className="p-3 rounded-xl bg-sage/50 border border-forest/10 text-xs">
              <strong>Accessibility Note:</strong> Pressing the <kbd className="px-1 py-0.5 rounded bg-white font-mono text-[10px]">ESC</kbd> key or clicking outside will smoothly dismiss this dialog.
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-forest/10">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Confirm Action
            </Button>
          </div>
        </Modal>
      </div>
    </AmbientBackground>
  );
};
