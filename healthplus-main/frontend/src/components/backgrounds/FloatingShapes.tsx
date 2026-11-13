import React from 'react';
import { cn } from '@/utils/cn';

export interface FloatingShapesProps {
  theme?: 'wellness' | 'forest' | 'gold';
  className?: string;
  animated?: boolean;
}

export const FloatingShapes: React.FC<FloatingShapesProps> = ({
  theme = 'wellness',
  className,
  animated = true,
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className
      )}
    >
      {/* Floating Shape 1: Soft Blurred Ambient Ring / Glow */}
      <div
        className={cn(
          'absolute top-[18%] left-[8%] w-36 h-36 rounded-full blur-2xl opacity-50',
          theme === 'forest'
            ? 'bg-emerald-500/20'
            : 'bg-sage/70 dark:bg-emerald-500/12',
          animated && 'animate-float-shape'
        )}
      />

      {/* Floating Shape 2: Soft Blurred Orb */}
      <div
        style={{ animationDelay: '-3s' }}
        className={cn(
          'absolute top-[55%] right-[10%] w-28 h-28 rounded-full blur-2xl opacity-50',
          theme === 'forest'
            ? 'bg-gold-500/15'
            : 'bg-emerald/15 dark:bg-emerald-500/15',
          animated && 'animate-float-shape'
        )}
      />

      {/* Floating Shape 3: Geometric Concentric Mini-Ring */}
      <div
        style={{ animationDelay: '-5s' }}
        className={cn(
          'absolute bottom-[20%] left-[22%] w-24 h-24 rounded-full border-2',
          theme === 'forest'
            ? 'border-emerald-400/20'
            : 'border-sage dark:border-white/10',
          animated && 'animate-float-shape'
        )}
      />
    </div>
  );
};
