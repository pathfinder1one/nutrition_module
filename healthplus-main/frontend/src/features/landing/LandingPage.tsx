import React from 'react';
import { HeroExperience } from './components/HeroExperience';
import { ObserveUnderstandGuide } from './components/ObserveUnderstandGuide';
import { FeaturePreviewsSection } from './components/FeaturePreviewsSection';
import { PrivacySection } from './components/PrivacySection';
import { FinalCtaSection } from './components/FinalCtaSection';

export interface LandingPageProps {
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate = () => {} }) => {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative flex flex-col">
      {/* 01. Calm Hero Intro -> Onboarding Signup CTA */}
      <HeroExperience
        onExplore={() => onNavigate('/signup')}
        onSeeHowItWorks={() => handleScrollTo('observe-understand-guide')}
      />

      {/* 02. Observe -> Understand -> Guide Philosophy */}
      <ObserveUnderstandGuide />

      {/* 03. Connected 3-Card Product Preview */}
      <FeaturePreviewsSection onNavigate={onNavigate} />

      {/* 04. Safety, IFCT Provenance & Privacy Guardrails */}
      <PrivacySection />

      {/* 05. Begin Journey CTA */}
      <FinalCtaSection
        onExplore={() => onNavigate('/signup')}
        onDesignSystem={() => onNavigate('/design-system')}
      />
    </div>
  );
};
