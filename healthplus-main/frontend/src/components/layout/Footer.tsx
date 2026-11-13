import React from 'react';

export const Footer: React.FC = () => {
  const footerLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'AI Intelligence', href: '#ai-intelligence' },
    { label: 'Privacy', href: '#privacy' },
  ];

  const handleLinkClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-forest/10 dark:border-white/10 bg-ivory/95 dark:bg-[#04120D]/95 backdrop-blur-md py-14 px-4 sm:px-6 lg:px-8 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest dark:bg-emerald-950/80 border border-emerald-500/20 flex items-center justify-center text-gold font-heading font-black text-lg shadow-md">
            H+
          </div>
          <div className="text-left">
            <p className="font-heading font-extrabold text-base text-forest dark:text-white leading-tight">HEALTH PLUS</p>
            <p className="text-xs font-bold text-emerald dark:text-emerald-400 uppercase tracking-wider">Observe. Understand. Guide.</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-forest/75 dark:text-ivory/70">
          {footerLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleLinkClick(link.href)}
              className="hover:text-emerald dark:hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Attribution & Status Pill */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
          <span className="font-medium text-forest/60 dark:text-ivory/50">Built by CASA Vital</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 dark:bg-emerald-500/10 border border-emerald/20 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-[11px] font-bold text-emerald dark:text-emerald-400">System Healthy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
