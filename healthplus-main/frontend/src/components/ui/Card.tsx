import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { ArrowUpRight, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'surface' | 'glass' | 'elevated' | 'outline' | 'dark';
  hoverEffect?: boolean;
  children?: React.ReactNode;
}

const cardVariants = {
  surface: 'bg-white border border-forest/8 shadow-subtle dark:bg-[#0A1E17]/90 dark:border-white/10 dark:text-white',
  glass: 'glass-surface shadow-card dark:glass-surface-dark dark:text-white',
  elevated: 'bg-white border border-forest/6 shadow-card hover:shadow-card-hover dark:bg-[#0A1E17]/90 dark:border-white/10 dark:text-white',
  outline: 'bg-transparent border border-forest/15 dark:border-white/20 dark:text-white',
  dark: 'glass-surface-dark text-ivory border-forest-light/40 shadow-card',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      hoverEffect = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
        className={cn(
          'rounded-2xl p-6 transition-shadow relative overflow-hidden',
          cardVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';

// 1. GlassCard
export const GlassCard: React.FC<CardProps> = ({ className, ...props }) => (
  <Card variant="glass" hoverEffect className={className} {...props} />
);

// 2. FeatureCard
export interface FeatureCardProps extends Omit<CardProps, 'children'> {
  icon?: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  badge,
  title,
  description,
  actionText,
  onAction,
  className,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      hoverEffect
      className={cn('flex flex-col justify-between group', className)}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-sage/60 dark:bg-white/10 text-emerald dark:text-emerald-400 flex items-center justify-center border border-forest/10 dark:border-white/10 group-hover:scale-105 group-hover:bg-emerald/10 transition-all">
              {icon}
            </div>
          )}
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sage/60 dark:bg-emerald-950/40 text-emerald dark:text-emerald-300 border border-emerald/20 dark:border-emerald-500/30">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-xl text-forest dark:text-white mb-2 group-hover:text-emerald dark:group-hover:text-emerald-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-forest/75 dark:text-ivory/70 leading-relaxed">{description}</p>
      </div>

      {actionText && (
        <div
          onClick={onAction}
          className="mt-6 pt-4 border-t border-forest/8 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald dark:text-emerald-400 cursor-pointer group-hover:text-emerald-light transition-colors"
        >
          <span>{actionText}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      )}
    </Card>
  );
};

// 3. StatCard
export interface StatCardProps extends Omit<CardProps, 'children'> {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    isPositive?: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  delta,
  icon,
  className,
  ...props
}) => {
  return (
    <Card variant="surface" hoverEffect className={cn('p-5', className)} {...props}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-forest/60 dark:text-ivory/60">
          {label}
        </span>
        {icon && <span className="text-emerald dark:text-emerald-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading font-extrabold text-3xl text-forest dark:text-white tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-forest/60 dark:text-ivory/60">{unit}</span>}
      </div>
      {delta && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-semibold px-1.5 py-0.5 rounded-full',
              delta.isPositive
                ? 'bg-emerald/10 text-emerald dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-status-danger/10 text-status-danger dark:bg-rose-500/20 dark:text-rose-300'
            )}
          >
            {delta.isPositive ? '↑' : '↓'} {delta.value}
          </span>
          {delta.period && <span className="text-forest/50 dark:text-ivory/50">{delta.period}</span>}
        </div>
      )}
    </Card>
  );
};

// 4. InsightCard
export interface InsightCardProps extends Omit<CardProps, 'children'> {
  category: 'Consistency' | 'Nutrition Shift' | 'Activity Link' | 'Baseline Alert';
  headline: string;
  explanation: string;
  evidenceCount?: number;
  confidenceScore?: number;
  onViewEvidence?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  category,
  headline,
  explanation,
  evidenceCount,
  confidenceScore,
  onViewEvidence,
  className,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      className={cn(
        'border-2 border-emerald/25 bg-gradient-to-br from-white via-sage-soft/30 to-emerald/5 dark:from-[#0A1E17] dark:via-[#092219] dark:to-[#05130F] dark:border-emerald-500/30',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald/15 dark:bg-emerald-950/60 text-emerald dark:text-emerald-300 border border-emerald/30">
          <CheckCircle2 className="w-3 h-3" />
          {category}
        </span>
        {confidenceScore !== undefined && (
          <span className="text-xs font-medium text-forest/60 dark:text-ivory/60">
            {Math.round(confidenceScore * 100)}% Confidence
          </span>
        )}
      </div>

      <h4 className="font-heading font-bold text-lg text-forest dark:text-white mb-2">{headline}</h4>
      <p className="text-sm text-forest/80 dark:text-ivory/75 leading-relaxed mb-4">{explanation}</p>

      <div className="flex items-center justify-between pt-3 border-t border-forest/8 dark:border-white/10">
        <button
          type="button"
          onClick={onViewEvidence}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald dark:text-emerald-400 hover:text-emerald-light transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{evidenceCount ? `View Evidence (${evidenceCount} days)` : 'View Evidence'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <span className="text-[11px] text-forest/50 dark:text-ivory/40">Verified Records</span>
      </div>
    </Card>
  );
};

// 5. InteractiveCard
export interface InteractiveCardProps extends CardProps {
  selected?: boolean;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  selected = false,
  className,
  children,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      hoverEffect
      className={cn(
        'cursor-pointer transition-all border-2',
        selected
          ? 'border-emerald bg-emerald-surface/20 dark:bg-emerald-950/40 shadow-glow-emerald'
          : 'border-forest/8 hover:border-emerald/40 dark:border-white/10 dark:hover:border-emerald-500/50',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};
