import React from 'react';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AmbientOrb } from './AmbientOrb';
import { GradientMesh } from './GradientMesh';
import { ParticleMesh } from './ParticleMesh';
import { FloatingShapes } from './FloatingShapes';
import { OrbitalRings } from './OrbitalRings';

export type BackgroundVariant = 'forest' | 'wellness' | 'intelligence' | 'orbital';
export type BackgroundIntensity = 'subtle' | 'medium' | 'vibrant';

export interface AmbientBackgroundProps {
  variant?: BackgroundVariant;
  intensity?: BackgroundIntensity;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  variant = 'wellness',
  intensity = 'medium',
  animated = true,
  className,
  children,
}) => {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animated && !prefersReduced;

  const intensityOpacity = {
    subtle: 0.5,
    medium: 0.8,
    vibrant: 1.0,
  }[intensity];

  return (
    <div
      className={cn(
        'relative w-full min-h-full overflow-hidden isolate',
        variant === 'forest' || variant === 'intelligence'
          ? 'bg-[#0B241E] text-ivory'
          : 'bg-ivory text-forest dark:bg-[#05130F] dark:text-[#E8F2EC]',
        className
      )}
    >
      {/* Background Decor Layer - strictly pointer-events-none */}
      <div
        aria-hidden="true"
        style={{ opacity: intensityOpacity }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      >
        {/* VARIANT A: FOREST (Deep Forest Green + Emerald Ambient Glow) */}
        {variant === 'forest' && (
          <>
            <GradientMesh theme="forest" animated={shouldAnimate} />
            <AmbientOrb
              color="emerald"
              size="xl"
              blur="lg"
              driftVariant="primary"
              className="-top-[10%] -left-[10%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="gold"
              size="md"
              blur="md"
              driftVariant="tertiary"
              className="bottom-[15%] right-[5%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="forest"
              size="lg"
              blur="lg"
              driftVariant="secondary"
              className="top-[40%] right-[30%]"
              animated={shouldAnimate}
            />
            <FloatingShapes theme="forest" animated={shouldAnimate} />
          </>
        )}

        {/* VARIANT B: WELLNESS (Warm Ivory + Sage Gradients + Subtle Emerald & Gold) */}
        {variant === 'wellness' && (
          <>
            <GradientMesh theme="wellness" animated={shouldAnimate} />
            <AmbientOrb
              color="sage"
              size="xl"
              blur="lg"
              driftVariant="primary"
              className="-top-[15%] left-[10%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="emerald"
              size="lg"
              blur="lg"
              driftVariant="secondary"
              className="top-[45%] -right-[10%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="gold"
              size="md"
              blur="md"
              driftVariant="tertiary"
              className="bottom-[5%] left-[25%]"
              animated={shouldAnimate}
            />
            <FloatingShapes theme="wellness" animated={shouldAnimate} />
          </>
        )}

        {/* VARIANT C: INTELLIGENCE (Dark Emerald Canvas + Connected Synaptic Nodes) */}
        {variant === 'intelligence' && (
          <>
            <GradientMesh theme="dark" animated={shouldAnimate} />
            <ParticleMesh color="emerald" animated={shouldAnimate} />
            <AmbientOrb
              color="emerald"
              size="lg"
              blur="lg"
              driftVariant="primary"
              className="top-[20%] left-[20%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="gold"
              size="md"
              blur="md"
              driftVariant="secondary"
              className="bottom-[20%] right-[20%]"
              animated={shouldAnimate}
            />
          </>
        )}

        {/* VARIANT D: ORBITAL (Concentric Translucent Rings + Soft Multi-Orbit Lighting) */}
        {variant === 'orbital' && (
          <>
            <GradientMesh theme="wellness" animated={shouldAnimate} />
            <OrbitalRings
              size="lg"
              theme="emerald"
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="emerald"
              size="md"
              blur="md"
              driftVariant="primary"
              className="top-[10%] left-[15%]"
              animated={shouldAnimate}
            />
            <AmbientOrb
              color="gold"
              size="sm"
              blur="sm"
              driftVariant="secondary"
              className="bottom-[15%] right-[15%]"
              animated={shouldAnimate}
            />
          </>
        )}
      </div>

      {/* Foreground Content Container */}
      {children}
    </div>
  );
};
