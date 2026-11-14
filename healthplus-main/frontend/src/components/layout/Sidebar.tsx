import React from 'react';
import {
  Sun,
  Utensils,
  Activity,
  Bot,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';

export interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = '/today',
  onNavigate = () => {},
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { state, streakDays, signOut } = useApp();
  const userName = state.profile?.basic.name || state.auth?.name || 'Member';
  // 5 Unified Core Pillars
  const mainNavItems = [
    {
      label: 'Today',
      path: '/today',
      aliases: ['/dashboard', '/today'],
      icon: <Sun className="w-4 h-4 text-amber-500 dark:text-gold" />,
      tag: 'Overview',
    },
    {
      label: 'Food',
      path: '/food',
      aliases: ['/food', '/food-scanner', '/nutrition-diary', '/diet-planner', '/grocery-list', '/scanner', '/diary'],
      icon: <Utensils className="w-4 h-4 text-emerald" />,
      tag: 'Nutrition & Recipes',
    },
    {
      label: 'Exercises',
      path: '/move',
      aliases: ['/move', '/exercise-studio', '/voice-coach', '/exercise', '/exercises'],
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      tag: '7+ AI Workouts',
    },
    {
      label: 'AI Coach',
      path: '/coach',
      aliases: ['/coach', '/ai-coach'],
      icon: <Bot className="w-4 h-4 text-gold" />,
      tag: 'Living Companion',
    },
    {
      label: 'Progress',
      path: '/progress',
      aliases: ['/progress', '/health-patterns', '/insights'],
      icon: <TrendingUp className="w-4 h-4 text-emerald" />,
      tag: 'Baseline & Trends',
    },
  ];

  const isItemActive = (aliases: string[]) => {
    return aliases.some((a) => currentPath === a || currentPath.startsWith(a));
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-forest/10 dark:border-white/10 bg-ivory dark:bg-[#071913] transition-[width] duration-200 z-30 select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Top Header */}
      <div>
        <div className="h-18 px-5 flex items-center justify-between border-b border-forest/8 dark:border-white/10">
          {!isCollapsed && (
            <div
              onClick={() => onNavigate('/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-forest dark:bg-emerald-950 border border-emerald-500/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="font-heading font-black text-sm text-gold">H+</span>
              </div>
              <div>
                <span className="font-heading font-extrabold text-base text-forest dark:text-white tracking-tight block leading-tight">
                  HEALTH PLUS
                </span>
                <span className="text-[10px] text-emerald dark:text-emerald-400 font-bold tracking-wider uppercase block">
                  AI Companion
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div
              onClick={() => onNavigate('/')}
              className="w-full flex justify-center cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-forest dark:bg-emerald-950 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                <span className="font-heading font-black text-sm text-gold">H+</span>
              </div>
            </div>
          )}

          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="p-1 rounded-lg text-forest/50 dark:text-ivory/50 hover:text-forest dark:hover:text-white hover:bg-forest/5 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 5 Core Pillars Navigation */}
        <nav className="p-3 space-y-2 mt-2">
          {!isCollapsed && (
            <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-forest/40 dark:text-ivory/40 mb-2">
              Core Pillars
            </div>
          )}

          {mainNavItems.map((item) => {
            const active = isItemActive(item.aliases);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold group relative',
                  active
                    ? 'bg-forest text-white dark:bg-emerald dark:text-white shadow-card font-bold ring-1 ring-emerald/30'
                    : 'text-forest/70 dark:text-ivory/70 hover:bg-forest/6 dark:hover:bg-white/10 hover:text-forest dark:hover:text-white'
                )}
              >
                <span className={cn('shrink-0 transition-transform group-hover:scale-110')}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate text-left text-[13px]">{item.label}</span>
                    {active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    ) : (
                      <span className="text-[10px] text-forest/40 dark:text-ivory/40 font-normal group-hover:text-forest/60 dark:group-hover:text-ivory/60">
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick AI Status Pill */}
        {!isCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/8 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald dark:text-emerald-400">
                AI Companion Active
              </span>
            </div>
            <p className="text-[11px] text-forest/70 dark:text-ivory/70 leading-snug">
              Continuous habit &amp; baseline observation enabled.
            </p>
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className="p-3 border-t border-forest/8 dark:border-white/10 space-y-2">
        <div
          onClick={() => onNavigate('/profile')}
          className={cn(
            'flex items-center gap-3 p-2 rounded-2xl hover:bg-forest/5 dark:hover:bg-white/10 cursor-pointer transition-colors group',
            isCollapsed && 'justify-center'
          )}
        >
          <Avatar name={userName} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-forest dark:text-white truncate">{userName}</div>
              <div className="text-[10px] text-emerald dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                <span>
                  {streakDays > 0 ? `Active Streak: ${streakDays}d` : 'Day 1 Ready'}
                </span>
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate('/settings')}
              className="flex items-center gap-1 text-forest/60 dark:text-ivory/60 hover:text-forest dark:hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                signOut();
                onNavigate('/login');
              }}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {isCollapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="w-full flex justify-center p-2 rounded-xl text-forest/50 dark:text-ivory/50 hover:bg-forest/5 dark:hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
