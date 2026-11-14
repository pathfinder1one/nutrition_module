import React, { useState } from 'react';
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Utensils,
  Activity,
  Bot,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { SectionAtmosphere, type AtmosphereVariant } from '@/components/backgrounds/SectionAtmosphere';
import { FloatingAiCompanion } from '@/components/ai/FloatingAiCompanion';

export interface DashboardLayoutProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  atmosphereVariant?: AtmosphereVariant;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath = '/today',
  onNavigate = () => {},
  atmosphereVariant,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { state, activeSafetyBanners, signOut } = useApp();

  const userName = state.profile?.basic.name || state.auth?.name || 'Member';
  const calorieTarget = state.targets?.calorieTarget ?? null;

  // Determine dynamic atmosphere variant based on route if not provided
  const getRouteAtmosphere = (): AtmosphereVariant => {
    if (atmosphereVariant) return atmosphereVariant;
    if (currentPath.includes('food') || currentPath.includes('scanner') || currentPath.includes('diary') || currentPath.includes('diet') || currentPath.includes('planner') || currentPath.includes('grocery')) return 'food';
    if (currentPath.includes('move') || currentPath.includes('exercise') || currentPath.includes('voice')) return 'exercise';
    if (currentPath.includes('coach')) return 'coach';
    if (currentPath.includes('progress') || currentPath.includes('pattern') || currentPath.includes('insight')) return 'progress';
    if (currentPath.includes('setting') || currentPath.includes('profile')) return 'privacy';
    return 'dashboard';
  };

  const getPageTitle = () => {
    if (currentPath.includes('food') || currentPath.includes('scanner') || currentPath.includes('diary') || currentPath.includes('diet') || currentPath.includes('grocery')) {
      return 'FOOD & NUTRITION INTELLIGENCE';
    }
    if (currentPath.includes('move') || currentPath.includes('exercise') || currentPath.includes('voice')) {
      return 'MOVE & KINEMATICS STUDIO';
    }
    if (currentPath.includes('coach')) {
      return 'AI HEALTH COMPANION';
    }
    if (currentPath.includes('progress') || currentPath.includes('pattern')) {
      return 'PROGRESS & HEALTH PATTERNS';
    }
    if (currentPath.includes('profile')) {
      return 'USER PROFILE & GOALS';
    }
    if (currentPath.includes('setting')) {
      return 'SETTINGS & DATA SOVEREIGNTY';
    }
    return 'TODAY • DAILY BRIEFING';
  };

  const notifications = [
    ...state.workoutsLogged.slice(0, 2).map((w) => ({
      title: `${w.exerciseLabel} Completed`,
      desc: `${w.repsCompleted} reps logged (${w.mode === 'camera_preview' ? 'Camera Guide' : 'Guided Session'}).`,
      time: w.timeLabel,
      unread: true,
    })),
    ...state.mealsLogged.slice(0, 2).map((m) => ({
      title: `${m.mealSlot.charAt(0).toUpperCase() + m.mealSlot.slice(1)} Logged`,
      desc: `${m.name} (~${m.calories} kcal, ${m.proteinG}g protein).`,
      time: m.timeLabel,
      unread: true,
    })),
    ...activeSafetyBanners.slice(0, 1).map((b) => ({
      title: b.title,
      desc: b.message,
      time: 'Active',
      unread: false,
    })),
  ];

  if (notifications.length === 0) {
    notifications.push({
      title: 'Personal Baseline Ready',
      desc: `Calibrated for ${userName}. Log your first meal or guided session when ready.`,
      time: 'Now',
      unread: false,
    });
  }

  // Mobile Bottom Navigation Bar Items (5 Core Pillars)
  const mobileNavItems = [
    { label: 'Today', path: '/today', aliases: ['/dashboard', '/today'], icon: <Sun className="w-5 h-5" /> },
    { label: 'Food', path: '/food', aliases: ['/food', '/food-scanner', '/nutrition-diary', '/diet-planner', '/grocery-list'], icon: <Utensils className="w-5 h-5" /> },
    { label: 'Move', path: '/move', aliases: ['/move', '/exercise-studio', '/voice-coach'], icon: <Activity className="w-5 h-5" /> },
    { label: 'Coach', path: '/coach', aliases: ['/coach', '/ai-coach'], icon: <Bot className="w-5 h-5" /> },
    { label: 'Progress', path: '/progress', aliases: ['/progress', '/health-patterns'], icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const isNavActive = (aliases: string[]) => {
    return aliases.some((a) => currentPath === a || currentPath.startsWith(a));
  };

  return (
    <div className="relative flex min-h-screen bg-ivory dark:bg-[#05130F] text-forest dark:text-ivory isolate">
      {/* Route-tailored dynamic background atmosphere */}
      <SectionAtmosphere variant={getRouteAtmosphere()} />

      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 h-18 px-4 sm:px-8 border-b border-forest/8 dark:border-white/10 bg-ivory/95 dark:bg-[#05130F]/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-forest dark:text-white hover:bg-forest/5 dark:hover:bg-white/10"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald dark:text-emerald-400">
                <span>HEALTH PLUS</span>
                <span className="text-forest/30 dark:text-ivory/30">•</span>
                <span>PERSONAL COMPANION</span>
              </div>
              <h1 className="font-heading font-extrabold text-sm sm:text-base text-forest dark:text-white tracking-tight leading-none mt-0.5">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-forest/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-forest dark:text-gold hover:bg-forest/5 dark:hover:bg-white/10 transition-all shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-forest hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="View notifications"
                className="relative p-2 rounded-xl border border-forest/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-forest/80 dark:text-ivory/80 hover:text-forest dark:hover:text-white hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald ring-2 ring-ivory dark:ring-[#05130F]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0A1E17] border border-forest/10 dark:border-white/10 shadow-2xl p-4 z-50 animate-fadeIn text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-forest/8 dark:border-white/10">
                    <span className="font-heading font-bold text-xs text-forest dark:text-white">Activity Alerts</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald/10 text-emerald font-semibold">2 New</span>
                  </div>
                  <div className="mt-2 space-y-2.5 max-h-64 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <div key={i} className={`p-2.5 rounded-xl text-xs transition-colors ${n.unread ? 'bg-forest/5 dark:bg-white/5 border border-forest/8 dark:border-white/10' : 'opacity-70'}`}>
                        <div className="flex items-center justify-between">
                          <strong className="text-forest dark:text-white font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald shrink-0" />
                            {n.title}
                          </strong>
                          <span className="text-[10px] text-forest/40 dark:text-ivory/40">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-forest/70 dark:text-ivory/70 mt-1 pl-5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-forest/10 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
              >
                <Avatar name={userName} size="sm" />
                <ChevronDown className="w-3.5 h-3.5 text-forest/60 dark:text-ivory/60" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0A1E17] border border-forest/10 dark:border-white/10 shadow-2xl p-2 z-50 animate-fadeIn text-left">
                  <div className="px-3 py-2 border-b border-forest/8 dark:border-white/10">
                    <p className="text-xs font-bold text-forest dark:text-white truncate">{userName}</p>
                    <p className="text-[10px] text-emerald dark:text-emerald-400 font-medium">
                      {calorieTarget ? `Daily Target: ${calorieTarget.toLocaleString()} kcal` : 'Calibrating profile'}
                    </p>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onNavigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-forest/80 dark:text-ivory/80 hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-emerald" />
                      <span>My Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onNavigate('/settings'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-forest/80 dark:text-ivory/80 hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-gold" />
                      <span>Settings &amp; Privacy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onNavigate('/'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-forest/80 dark:text-ivory/80 hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-forest" />
                      <span>Public Landing</span>
                    </button>
                    <div className="pt-1 border-t border-forest/8 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                          onNavigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Nav Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-forest/60 dark:bg-black/80 backdrop-blur-sm">
            <div className="w-72 h-full bg-ivory dark:bg-[#071913] p-4 shadow-2xl flex flex-col justify-between">
              <Sidebar
                currentPath={currentPath}
                onNavigate={(p) => {
                  onNavigate(p);
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Demonstration Account Provenance Banner */}
        {state.auth?.isDemoAccount && (
          <div
            role="status"
            data-testid="demo-account-banner"
            className="px-4 sm:px-8 py-2.5 border-b border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/50 text-forest dark:text-amber-100 flex flex-wrap items-center justify-between gap-2 text-xs z-20"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                Demonstration Data
              </span>
              <span className="font-medium">
                Signed in to pre-created demo account <strong>{userName}</strong>. Sample
                profile, meals &amp; workouts shown below are isolated from personal accounts.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                onNavigate('/login');
              }}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
            >
              Exit Demo / Switch Account
            </button>
          </div>
        )}

        {/* Scrollable Children Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto relative z-10">{children}</main>

        {/* Mobile Bottom Navigation Bar (5 Core Pillars) */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-ivory/95 dark:bg-[#071913]/95 backdrop-blur-lg border-t border-forest/10 dark:border-white/10 z-40 flex items-center justify-around px-2 select-none"
        >
          {mobileNavItems.map((item) => {
            const active = isNavActive(item.aliases);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  active
                    ? 'text-emerald dark:text-emerald-400 font-bold scale-105'
                    : 'text-forest/60 dark:text-ivory/60 hover:text-forest dark:hover:text-white'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-emerald mt-0.5" />}
              </button>
            );
          })}
        </nav>

        {/* Global Persistent Floating AI Companion (hidden on /coach page to avoid redundant clutter) */}
        {currentPath !== '/coach' && <FloatingAiCompanion onNavigate={onNavigate} />}
      </div>
    </div>
  );
};
