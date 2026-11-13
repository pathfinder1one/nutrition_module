import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';

export interface NavbarProps {
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate = () => {},
  currentPath = '/',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', path: '/' },
    { label: 'Philosophy', href: '#observe-understand-guide', path: '#observe-understand-guide' },
    { label: 'Features', href: '#features', path: '#features' },
    { label: 'Privacy & Safety', href: '#privacy', path: '#privacy' },
    { label: 'Design System', href: '/design-system', path: '/design-system' },
  ];

  const handleNavClick = (href: string, path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/')) {
      onNavigate(path);
      return;
    }
    if (currentPath !== '/' && currentPath !== '') {
      onNavigate('/');
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate(path);
      }
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-header w-full',
        isScrolled
          ? 'bg-ivory/85 dark:bg-[#05130F]/85 backdrop-blur-md border-b border-forest/8 dark:border-white/10 shadow-subtle'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => {
            onNavigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-forest dark:bg-emerald/20 border border-transparent dark:border-emerald/40 flex items-center justify-center shadow-md shadow-forest/20 group-hover:scale-105 transition-transform">
            <span className="font-heading font-black text-xl text-gold">H+</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-extrabold text-lg text-forest dark:text-ivory tracking-tight leading-none">
              HEALTH PLUS
            </span>
            <span className="text-[10px] font-semibold text-emerald dark:text-emerald-light tracking-wider uppercase mt-0.5">
              Observe. Understand. Guide.
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNavClick(link.href, link.path)}
              className="px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide text-forest/75 dark:text-ivory/75 hover:text-forest dark:hover:text-ivory hover:bg-forest/5 dark:hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Actions & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-xl border border-forest/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-forest dark:text-gold hover:bg-forest/5 dark:hover:bg-white/10 transition-all shadow-sm group"
            title={theme === 'dark' ? 'Switch to Warm Ivory Light Mode' : 'Switch to Deep Forest Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-gold group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-forest group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/login')}
            className="text-xs font-semibold text-forest dark:text-white"
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/signup')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="shadow-md shadow-emerald/20 text-xs font-bold"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu & Theme Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl border border-forest/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-forest dark:text-gold"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-forest" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-forest dark:text-ivory hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-ivory/98 dark:bg-[#071612]/98 backdrop-blur-xl border-b border-forest/10 dark:border-white/10 px-6 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.href, link.path)}
                className="text-left py-2.5 px-3 rounded-xl text-sm font-semibold text-forest dark:text-ivory hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-forest/8 dark:border-white/10 flex flex-col gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/login');
              }}
              className="w-full text-xs font-semibold dark:border-white/20 dark:text-ivory"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/design-system');
              }}
              className="w-full text-xs dark:border-white/20 dark:text-ivory"
            >
              Design System Showcase
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/signup');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full text-xs font-bold shadow-md shadow-emerald/20"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
