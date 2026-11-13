import React from 'react';
import { cn } from '@/utils/cn';

export interface ProgressBarProps {
  progress?: number; // 0 to 100
  value?: number;
  current?: number;
  target?: number;
  unit?: string;
  variant?: 'emerald' | 'gold' | 'forest' | 'danger' | string;
  color?: 'emerald' | 'gold' | 'forest' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  valueText?: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald',
  gold: 'bg-gold',
  forest: 'bg-forest',
  danger: 'bg-status-danger',
};

const heightMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  value,
  current,
  target,
  unit,
  variant,
  color,
  size = 'md',
  label,
  valueText,
  className,
}) => {
  const actualProgress = progress ?? (current !== undefined && target ? (current / target) * 100 : (value ?? 0));
  const normalizedProgress = Math.min(Math.max(actualProgress, 0), 100);
  const effectiveColorKey = (color || variant || 'emerald') as string;
  const colorClass = colorMap[effectiveColorKey] || 'bg-emerald';
  const displayValue = valueText || (current !== undefined && target !== undefined ? `${current} / ${target}${unit ? ` ${unit}` : ''}` : undefined);

  return (
    <div className={cn('w-full flex flex-col gap-1.5 select-none', className)}>
      {(label || displayValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-semibold text-forest/80 dark:text-ivory/80">{label}</span>}
          {displayValue && (
            <span className="font-medium text-forest/60 dark:text-ivory/60 tabular-nums">{displayValue}</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-forest/10 dark:bg-white/15 rounded-full overflow-hidden', heightMap[size])}>
        <div
          style={{ width: `${normalizedProgress}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorClass
          )}
        />
      </div>
    </div>
  );
};
