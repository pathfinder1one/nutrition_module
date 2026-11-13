import React from 'react';
import { ShieldCheck, Lock, Download, Trash2, EyeOff, Sliders, CheckCircle2 } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SectionAtmosphere } from '@/components/backgrounds';

export const PrivacySection: React.FC = () => {
  const privacyPillars = [
    {
      title: 'Private Browser Experience',
      desc: 'Optional camera mirror preview runs purely locally in your browser. Continuous video is never streamed or stored remotely.',
      icon: <EyeOff className="w-5 h-5 text-emerald" />,
      tag: 'Zero Video Storage',
    },
    {
      title: 'Honest Nutrition Provenance',
      desc: 'Dishes show standardized Indian home-portion prototype estimates alongside explicit disclaimers — never invented clinical claims.',
      icon: <Lock className="w-5 h-5 text-gold" />,
      tag: 'Prototype Estimate Disclosure',
    },
    {
      title: 'Complete Data Portability',
      desc: 'Export your entire wellness profile, pantry settings, meals, and workouts as clean structured JSON whenever you wish.',
      icon: <Download className="w-5 h-5 text-emerald dark:text-gold" />,
      tag: 'One-Click JSON Export',
    },
    {
      title: 'Non-Diagnostic Safety Boundaries',
      desc: 'Hard allergy/gluten exclusions, safe calorie floors, and automatic clinical referrals for higher-care conditions — plus 1-click full reset.',
      icon: <Trash2 className="w-5 h-5 text-rose-500" />,
      tag: 'Safety First',
    },
  ];

  const userControls = [
    { label: 'Camera Permissions', desc: 'Opt in/out of camera pose tracking at any time' },
    { label: 'Notification Preferences', desc: 'Granular controls for meal reminders and workout alerts' },
    { label: 'AI Data Preferences', desc: 'Control whether your data feeds pattern synthesis' },
    { label: 'Export & Account Deletion', desc: 'Full sovereignty over your wellness identity' },
  ];

  return (
    <section id="privacy" className="py-24 relative overflow-hidden isolate">
      <SectionAtmosphere variant="privacy" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Data Sovereignty & Privacy"
          title="Privacy and User Control by Design"
          subtitle="We designed HEALTH PLUS with strict privacy-by-design boundaries. Your camera stays local, your data is sovereign, and you maintain complete control over all intelligence features."
          align="center"
        />

        {/* 4 Privacy Architecture Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {privacyPillars.map((p) => (
            <div
              key={p.title}
              className="p-6 rounded-3xl bg-white/80 dark:bg-[#0A1E17]/90 backdrop-blur-md border border-forest/10 dark:border-white/10 shadow-card flex flex-col justify-between transition-colors duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sage/60 dark:bg-white/5 flex items-center justify-center border border-forest/8 dark:border-white/10">
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest/8 dark:bg-white/10 text-forest/70 dark:text-emerald-300 font-mono">
                    {p.tag}
                  </span>
                </div>

                <h4 className="font-heading font-bold text-base text-forest dark:text-white mb-2">
                  {p.title}
                </h4>
                <p className="text-xs text-forest/70 dark:text-ivory/70 leading-relaxed font-sans">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-forest/8 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-emerald dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy &amp; Safety Control</span>
              </div>
            </div>
          ))}
        </div>

        {/* User Control Checklist & Row-Level Security Banner */}
        <div className="mt-8 p-8 rounded-3xl bg-forest dark:bg-[#04120D] text-ivory flex flex-col lg:flex-row items-center justify-between gap-8 text-left shadow-2xl border border-forest-light/40 dark:border-emerald-500/20">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              <Sliders className="w-4 h-4" />
              <span>Full User Governance</span>
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-ivory tracking-tight">
              You decide what to share, record, and export.
            </h3>
            <p className="text-xs text-ivory/75 max-w-xl font-sans leading-relaxed">
              Every setting—from camera permissions and meal reminder frequencies to AI context grounding—is under your control in your personal profile settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            {userControls.map((c) => (
              <div key={c.label} className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 text-xs">
                <span className="font-bold text-ivory flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                  {c.label}
                </span>
                <span className="text-[11px] text-ivory/70 block mt-0.5">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
