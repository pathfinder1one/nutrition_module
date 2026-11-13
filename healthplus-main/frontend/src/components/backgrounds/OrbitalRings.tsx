import React from 'react';
import { cn } from '@/utils/cn';

export interface OrbitalRingsProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'emerald' | 'gold' | 'forest';
  className?: string;
  animated?: boolean;
}

export const OrbitalRings: React.FC<OrbitalRingsProps> = ({
  size = 'md',
  theme = 'emerald',
  className,
  animated = true,
}) => {
  const sizeClasses = {
    sm: 'w-[320px] h-[320px]',
    md: 'w-[480px] h-[480px]',
    lg: 'w-[680px] h-[680px]',
  }[size];

  const ringBorder = theme === 'gold' 
    ? 'border-gold/30' 
    : theme === 'forest' 
    ? 'border-forest/20' 
    : 'border-emerald/25';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute select-none flex items-center justify-center',
        sizeClasses,
        className
      )}
    >
      {/* Outer Orbit */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border border-dashed',
          ringBorder,
          animated && 'animate-orbital-cw'
        )}
      >
        {/* Orbit Node */}
        <div className="absolute -top-1.5 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-emerald shadow-glow-emerald" />
      </div>

      {/* Middle Orbit */}
      <div
        className={cn(
          'absolute inset-10 sm:inset-14 rounded-full border',
          ringBorder,
          animated && 'animate-orbital-ccw'
        )}
      >
        {/* Gold Satellite Node */}
        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-gold shadow-glow-gold" />
      </div>

      {/* Inner Orbit */}
      <div
        className={cn(
          'absolute inset-24 sm:inset-28 rounded-full border border-dotted',
          ringBorder,
          animated && 'animate-orbital-cw'
        )}
      />

      {/* Center Ambient Core Glow */}
      <div className="w-20 h-20 rounded-full bg-emerald/15 blur-xl animate-pulse-breath" />
    </div>
  );
};
