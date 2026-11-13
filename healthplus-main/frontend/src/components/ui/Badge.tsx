import React from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'emerald' | 'sage' | 'gold' | 'forest' | 'danger' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald/15 text-emerald border border-emerald/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  sage: 'bg-sage/70 text-forest border border-forest/10 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30',
  gold: 'bg-gold/20 text-[#A66E1E] border border-gold/40 dark:text-gold dark:border-gold/30',
  forest: 'bg-forest text-ivory border border-forest-light/40 dark:bg-emerald-950/80 dark:border-white/10',
  danger: 'bg-status-danger/15 text-status-danger border border-status-danger/30 dark:bg-rose-500/20 dark:text-rose-300',
  outline: 'bg-transparent text-forest/80 border border-forest/20 dark:text-ivory/80 dark:border-white/20',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium gap-1',
  md: 'text-xs px-2.5 py-1 rounded-full font-semibold gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'emerald',
  size = 'md',
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center tracking-wide select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
