import React from 'react';
import { cn } from '@/utils/cn';

export interface AmbientOrbProps {
  color?: 'emerald' | 'sage' | 'gold' | 'forest';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: 'sm' | 'md' | 'lg';
  driftVariant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

const colorMap = {
  emerald: 'bg-[radial-gradient(circle,rgba(24,122,91,0.28)_0%,rgba(24,122,91,0)_70%)] dark:bg-[radial-gradient(circle,rgba(34,197,94,0.22)_0%,rgba(34,197,94,0)_70%)]',
  sage: 'bg-[radial-gradient(circle,rgba(221,236,227,0.45)_0%,rgba(221,236,227,0)_75%)] dark:bg-[radial-gradient(circle,rgba(24,122,91,0.15)_0%,rgba(24,122,91,0)_75%)]',
  gold: 'bg-[radial-gradient(circle,rgba(231,183,107,0.22)_0%,rgba(231,183,107,0)_70%)] dark:bg-[radial-gradient(circle,rgba(231,183,107,0.18)_0%,rgba(231,183,107,0)_70%)]',
  forest: 'bg-[radial-gradient(circle,rgba(18,59,50,0.35)_0%,rgba(18,59,50,0)_75%)] dark:bg-[radial-gradient(circle,rgba(11,36,30,0.6)_0%,rgba(11,36,30,0)_75%)]',
};

const sizeMap = {
  sm: 'w-64 h-64',
  md: 'w-96 h-96',
  lg: 'w-[520px] h-[520px]',
  xl: 'w-[700px] h-[700px]',
};

const blurMap = {
  sm: 'blur-2xl',
  md: 'blur-3xl',
  lg: 'blur-[90px]',
};

const animationMap = {
  primary: 'animate-drift-primary',
  secondary: 'animate-drift-secondary',
  tertiary: 'animate-drift-tertiary',
};

export const AmbientOrb: React.FC<AmbientOrbProps> = ({
  color = 'emerald',
  size = 'md',
  blur = 'lg',
  driftVariant = 'primary',
  className,
  style,
  animated = true,
}) => {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        'pointer-events-none absolute rounded-full select-none',
        colorMap[color],
        sizeMap[size],
        blurMap[blur],
        animated && animationMap[driftVariant],
        className
      )}
    />
  );
};
