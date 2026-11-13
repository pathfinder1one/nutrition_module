import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Sparkles, Shield, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WellnessCore3D } from './WellnessCore3D';

export interface HeroExperienceProps {
  onExplore?: () => void;
  onSeeHowItWorks?: () => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  onExplore = () => {},
  onSeeHowItWorks = () => {},
}) => {
  return (
    <section id="hero" className="relative min-h-[640px] lg:min-h-[760px] flex items-center justify-center pt-8 pb-16 overflow-hidden isolate">
      {/* Cinematic Ambient Background Rays */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald/15 dark:bg-emerald/20 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full bg-gold/10 dark:bg-gold/15 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Actions (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex flex-col items-start text-left space-y-6"
          >
            {/* Top Credibility Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage/70 dark:bg-white/5 border border-forest/10 dark:border-white/15 text-xs font-semibold text-forest dark:text-ivory shadow-subtle backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse shadow-glow-emerald" />
              <span>AI-Powered Personal Wellness Ecosystem</span>
              <span className="text-forest/30 dark:text-ivory/30">•</span>
              <span className="text-emerald dark:text-emerald-light font-bold">CASA Vital</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-forest dark:text-ivory tracking-tight leading-[1.06]">
              Your health creates patterns.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald via-emerald-light to-forest dark:from-emerald-light dark:via-gold dark:to-ivory">
                Understand what they mean.
              </span>
            </h1>

            {/* Supporting Copy — directly answering What / How / What happens when you join */}
            <p className="font-sans text-base sm:text-lg text-forest/80 dark:text-ivory/80 leading-relaxed max-w-xl">
              An AI personal wellness companion for Indian meals and everyday movement. Join, complete a quick guided interview with optional safety preferences, and get adaptive home-kitchen meals and workouts shaped around your day.
            </p>

            {/* Action CTA Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={onExplore}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-xl shadow-emerald/25 text-base font-bold"
              >
                Begin Your Personal Setup
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onSeeHowItWorks}
                leftIcon={<Play className="w-4 h-4 text-emerald fill-emerald/20" />}
                className="w-full sm:w-auto text-base dark:border-white/20 dark:text-ivory dark:hover:bg-white/10"
              >
                See How It Works
              </Button>
            </div>

            {/* Trust & Transparency Feature Micro-Pills */}
            <div className="pt-4 flex flex-wrap items-center gap-5 text-xs font-medium text-forest/75 dark:text-ivory/70 border-t border-forest/8 dark:border-white/10 w-full">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald" />
                <span>Allergy &amp; Non-Diagnostic Safety</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-gold" />
                <span>Indian Home Kitchen Context</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald" />
                <span>Hindi, Hinglish &amp; English Voice</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Genuine 3D Three.js Wellness Core Experience (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex items-center justify-center w-full"
          >
            <WellnessCore3D />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
