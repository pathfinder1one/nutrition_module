import React from 'react';
import { cn } from '@/utils/cn';

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  color?: 'emerald' | 'gold' | 'forest';
  label?: string;
  valueText?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'emerald',
  label,
  valueText,
  className,
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  const strokeColor = {
    emerald: '#187A5B',
    gold: '#E7B76B',
    forest: '#123B32',
  }[color];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(18, 59, 50, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {valueText ? (
          <span className="font-heading font-extrabold text-xl text-forest tabular-nums">
            {valueText}
          </span>
        ) : (
          <span className="font-heading font-extrabold text-xl text-forest tabular-nums">
            {Math.round(normalizedProgress)}%
          </span>
        )}
        {label && <span className="text-[11px] font-medium text-forest/60 mt-0.5">{label}</span>}
      </div>
    </div>
  );
};
