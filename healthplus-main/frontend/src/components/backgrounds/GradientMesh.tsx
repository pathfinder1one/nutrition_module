import React from 'react';
import { cn } from '@/utils/cn';

export interface GradientMeshProps {
  theme?: 'forest' | 'wellness' | 'dark' | 'gold';
  opacity?: number;
  className?: string;
  animated?: boolean;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({
  theme = 'wellness',
  opacity = 0.85,
  className,
  animated = true,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className
      )}
    >
      {theme === 'forest' && (
        <div
          className={cn(
            'absolute inset-0 bg-[#0B241E]',
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#187A5B]/30 via-[#123B32]/70 to-[#0B241E]',
            animated && 'animate-pulse-breath'
          )}
        />
      )}

      {theme === 'wellness' && (
        <div className="absolute inset-0 bg-ivory dark:bg-[#05130F]">
          <div
            className={cn(
              'absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(221,236,227,0.6)_0%,rgba(221,236,227,0)_70%)] dark:bg-[radial-gradient(circle,rgba(24,122,91,0.22)_0%,rgba(24,122,91,0)_70%)]',
              animated && 'animate-drift-primary'
            )}
          />
          <div
            className={cn(
              'absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(24,122,91,0.18)_0%,rgba(24,122,91,0)_70%)] dark:bg-[radial-gradient(circle,rgba(231,183,107,0.15)_0%,rgba(231,183,107,0)_70%)]',
              animated && 'animate-drift-secondary'
            )}
          />
          <div
            className={cn(
              'absolute top-[35%] left-[45%] w-[45vw] h-[45vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(231,183,107,0.15)_0%,rgba(231,183,107,0)_70%)] dark:bg-[radial-gradient(circle,rgba(18,59,50,0.4)_0%,rgba(18,59,50,0)_70%)]',
              animated && 'animate-drift-tertiary'
            )}
          />
        </div>
      )}

      {theme === 'dark' && (
        <div className="absolute inset-0 bg-[#0B241E]">
          <div
            className={cn(
              'absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(24,122,91,0.25)_0%,rgba(24,122,91,0)_70%)]',
              animated && 'animate-drift-primary'
            )}
          />
          <div
            className={cn(
              'absolute bottom-0 left-0 w-[55vw] h-[55vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(231,183,107,0.14)_0%,rgba(231,183,107,0)_70%)]',
              animated && 'animate-drift-secondary'
            )}
          />
        </div>
      )}

      {theme === 'gold' && (
        <div className="absolute inset-0 bg-ivory dark:bg-[#05130F]">
          <div
            className={cn(
              'absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full',
              'bg-[radial-gradient(circle,rgba(231,183,107,0.25)_0%,rgba(231,183,107,0)_70%)]',
              animated && 'animate-drift-primary'
            )}
          />
        </div>
      )}
    </div>
  );
};
