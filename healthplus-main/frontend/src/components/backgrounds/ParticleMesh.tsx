import React from 'react';
import { cn } from '@/utils/cn';

export interface ParticleMeshProps {
  color?: 'emerald' | 'gold' | 'sage';
  density?: 'low' | 'medium' | 'high';
  className?: string;
  animated?: boolean;
}

export const ParticleMesh: React.FC<ParticleMeshProps> = ({
  color = 'emerald',
  className,
  animated = true,
}) => {
  const nodeStroke = color === 'emerald' ? '#22A078' : color === 'gold' ? '#E7B76B' : '#DDECE3';
  const lineStroke = color === 'emerald' ? 'rgba(34,160,120,0.18)' : color === 'gold' ? 'rgba(231,183,107,0.18)' : 'rgba(221,236,227,0.2)';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className
      )}
    >
      <svg
        className={cn(
          'w-full h-full opacity-60',
          animated && 'animate-drift-tertiary'
        )}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Synaptic Network Connecting Lines */}
        <path
          d="M 150,180 L 320,240 L 480,160 L 680,280 L 880,200 L 1050,300"
          stroke={lineStroke}
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 220,450 L 380,380 L 580,500 L 780,420 L 960,540"
          stroke={lineStroke}
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 320,240 L 380,380 M 480,160 L 580,500 M 680,280 L 780,420 M 880,200 L 960,540"
          stroke={lineStroke}
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
        />

        {/* Intelligence Nodes */}
        {[
          { cx: 150, cy: 180, r: 4 },
          { cx: 320, cy: 240, r: 5 },
          { cx: 480, cy: 160, r: 4.5 },
          { cx: 680, cy: 280, r: 6 },
          { cx: 880, cy: 200, r: 5 },
          { cx: 1050, cy: 300, r: 4 },
          { cx: 220, cy: 450, r: 4.5 },
          { cx: 380, cy: 380, r: 5 },
          { cx: 580, cy: 500, r: 6 },
          { cx: 780, cy: 420, r: 5 },
          { cx: 960, cy: 540, r: 4.5 },
        ].map((node, i) => (
          <g key={i}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 2.5}
              fill={nodeStroke}
              opacity="0.15"
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={nodeStroke}
              filter="url(#glow)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
