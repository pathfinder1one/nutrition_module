import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionAtmosphere } from '@/components/backgrounds';

export interface FinalCtaSectionProps {
  onExplore?: () => void;
  onDesignSystem?: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onExplore = () => {},
  onDesignSystem = () => {},
}) => {
  return (
    <section className="py-28 relative overflow-hidden bg-forest dark:bg-[#04120D] text-ivory isolate border-t border-forest-light/30 dark:border-white/10 transition-colors duration-300">
      <SectionAtmosphere variant="cta" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 text-xs font-semibold text-gold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Next Generation of Personal Wellness</span>
        </div>

        <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-ivory tracking-tight leading-[1.08] max-w-3xl mx-auto">
          Better habits start with better understanding.
        </h2>

        <p className="font-sans text-base sm:text-lg text-ivory/80 max-w-2xl mx-auto leading-relaxed">
          Discover how your everyday food, movement, and lifestyle data can work together to create an explainable,
          empowering picture of your personal wellness journey.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="gold"
            size="lg"
            onClick={onExplore}
            rightIcon={<ArrowRight className="w-4 h-4 text-forest" />}
            className="shadow-xl shadow-gold/20"
          >
            Explore Health Plus
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onDesignSystem}
            className="text-ivory border-white/20 hover:bg-white/10"
          >
            Inspect Design System
          </Button>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ivory/60 border-t border-white/10 max-w-xl mx-auto">
          <span>Non-Diagnostic Wellness</span>
          <span>•</span>
          <span>Zero Fabricated Metrics</span>
          <span>•</span>
          <span>Strict Multi-Tenant Isolation</span>
        </div>
      </div>
    </section>
  );
};
