import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type LivingAtmosphereVariant =
  | 'default'
  | 'hero'
  | 'observe'
  | 'understand'
  | 'guide'
  | 'privacy'
  | 'cta'
  | 'auth'
  | 'dashboard'
  | 'exercise'
  | 'today'
  | 'food'
  | 'move'
  | 'coach'
  | 'progress';

interface LivingAtmosphereProps {
  variant?: LivingAtmosphereVariant;
  fixed?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  hue: 'emerald' | 'gold' | 'teal';
}

export const LivingAtmosphere: React.FC<LivingAtmosphereProps> = ({
  variant = 'today',
  fixed = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const prefersReduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count =
      variant === 'progress'
        ? 28
        : variant === 'food'
          ? 20
          : variant === 'move' || variant === 'exercise'
            ? 18
            : 24;
    const particles: Particle[] = Array.from({ length: count }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (variant === 'move' || variant === 'exercise' ? 0.45 : 0.18),
      vy:
        variant === 'food'
          ? -0.14 - Math.random() * 0.18
          : (Math.random() - 0.5) * 0.18,
      r: variant === 'food' ? 18 + Math.random() * 26 : 1.8 + Math.random() * 2.4,
      alpha: variant === 'food' ? 0.05 + Math.random() * 0.05 : 0.22 + Math.random() * 0.3,
      hue: idx % 5 === 0 ? 'gold' : idx % 3 === 0 ? 'teal' : 'emerald',
    }));

    let rafId = 0;
    let time = 0;

    const getFill = (hue: Particle['hue'], alpha: number) => {
      if (hue === 'gold') {
        return isDark ? `rgba(231,183,107,${alpha})` : `rgba(184,122,30,${alpha * 0.8})`;
      }
      if (hue === 'teal') {
        return isDark ? `rgba(45,212,191,${alpha})` : `rgba(20,184,166,${alpha * 0.75})`;
      }
      return isDark ? `rgba(52,211,153,${alpha})` : `rgba(24,122,91,${alpha * 0.75})`;
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Variant-specific depth layer
      if (variant === 'today' || variant === 'dashboard' || variant === 'coach' || variant === 'auth') {
        const waveCount = variant === 'coach' ? 3 : 2;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const baseY = height * (0.28 + w * 0.22);
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= width; x += 48) {
            const yOffset =
              Math.sin(x * 0.0032 + time * 0.5 + w * 1.4) * (variant === 'coach' ? 26 : 18);
            ctx.lineTo(x, baseY + yOffset);
          }
          ctx.strokeStyle = isDark
            ? `rgba(52,211,153,${variant === 'coach' ? 0.08 : 0.055})`
            : `rgba(24,122,91,${variant === 'coach' ? 0.065 : 0.04})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      if (variant === 'coach') {
        // Subtle harmonic radar rings near top center
        const cx = width * 0.5;
        const cy = height * 0.22;
        for (let i = 1; i <= 3; i++) {
          const radius = 110 + i * 75 + Math.sin(time * 0.7 + i) * 8;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? 'rgba(231,183,107,0.06)' : 'rgba(24,122,91,0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (variant === 'move' || variant === 'exercise') {
        // Kinetic angled perspective arcs suggesting motion vectors
        for (let i = 0; i < 4; i++) {
          const offset = ((time * 22 + i * 240) % (width + 400)) - 200;
          ctx.beginPath();
          ctx.moveTo(offset, height);
          ctx.lineTo(offset + 280, 0);
          ctx.strokeStyle = isDark ? 'rgba(16,185,129,0.05)' : 'rgba(24,122,91,0.04)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      }

      // Draw & update nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -40) p.x = width + 40;
          if (p.x > width + 40) p.x = -40;
          if (p.y < -40) p.y = height + 40;
          if (p.y > height + 40) p.y = -40;
        }

        if (variant === 'progress') {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 155) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              const lineAlpha = (1 - dist / 155) * (isDark ? 0.14 : 0.09);
              ctx.strokeStyle = `rgba(24,185,130,${lineAlpha})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();
            }
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = getFill(p.hue, p.alpha);
        ctx.fill();
      }
    };

    const tick = () => {
      time += 0.016;
      drawFrame();
      if (!prefersReduced) {
        rafId = requestAnimationFrame(tick);
      }
    };

    tick();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [variant, isDark, prefersReduced]);

  const paletteMap: Record<LivingAtmosphereVariant, { top: string; bottom: string }> = {
    default: {
      top: isDark ? 'bg-emerald-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-gold/12' : 'bg-gold/15',
    },
    hero: {
      top: isDark ? 'bg-emerald-500/16' : 'bg-emerald/12',
      bottom: isDark ? 'bg-gold/14' : 'bg-gold/18',
    },
    observe: {
      top: isDark ? 'bg-emerald-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-teal-400/12' : 'bg-gold/14',
    },
    understand: {
      top: isDark ? 'bg-teal-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-emerald-500/12' : 'bg-amber-300/16',
    },
    guide: {
      top: isDark ? 'bg-emerald-500/15' : 'bg-emerald/12',
      bottom: isDark ? 'bg-gold/14' : 'bg-gold/16',
    },
    privacy: {
      top: isDark ? 'bg-emerald-500/12' : 'bg-emerald/8',
      bottom: isDark ? 'bg-teal-500/12' : 'bg-gold/12',
    },
    cta: {
      top: isDark ? 'bg-emerald-500/15' : 'bg-emerald/12',
      bottom: isDark ? 'bg-gold/14' : 'bg-gold/16',
    },
    auth: {
      top: isDark ? 'bg-emerald-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-gold/12' : 'bg-gold/14',
    },
    dashboard: {
      top: isDark ? 'bg-emerald-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-gold/12' : 'bg-gold/15',
    },
    exercise: {
      top: isDark ? 'bg-teal-400/14' : 'bg-teal-500/10',
      bottom: isDark ? 'bg-emerald-600/14' : 'bg-emerald/12',
    },
    today: {
      top: isDark ? 'bg-emerald-500/14' : 'bg-emerald/10',
      bottom: isDark ? 'bg-gold/12' : 'bg-gold/15',
    },
    food: {
      top: isDark ? 'bg-emerald-500/12' : 'bg-emerald/10',
      bottom: isDark ? 'bg-amber-400/12' : 'bg-amber-300/18',
    },
    move: {
      top: isDark ? 'bg-teal-400/14' : 'bg-teal-500/10',
      bottom: isDark ? 'bg-emerald-600/14' : 'bg-emerald/12',
    },
    coach: {
      top: isDark ? 'bg-emerald-500/15' : 'bg-emerald/12',
      bottom: isDark ? 'bg-gold/14' : 'bg-gold/16',
    },
    progress: {
      top: isDark ? 'bg-emerald-400/12' : 'bg-emerald/10',
      bottom: isDark ? 'bg-teal-500/12' : 'bg-gold/14',
    },
  };
  const activePalette = paletteMap[variant] ?? paletteMap.default;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 z-0 overflow-hidden select-none ${className}`}
    >
      {/* Semantic canvas backdrop — painted only by root page backdrop, never by section overlays */}
      {fixed && (
        <div className={`absolute inset-0 ${isDark ? 'bg-[#051410]' : 'bg-[#FAF9F5]'}`} />
      )}

      {/* Volumetric Soft Aurora Blobs */}
      <div
        className={`absolute -top-36 -right-24 w-[520px] h-[520px] rounded-full blur-[120px] ${activePalette.top} ${
          prefersReduced ? '' : 'animate-pulse-slow'
        }`}
      />
      <div
        className={`absolute -bottom-36 -left-24 w-[540px] h-[540px] rounded-full blur-[130px] ${activePalette.bottom} ${
          prefersReduced ? '' : 'animate-drift-medium'
        }`}
      />

      {/* Bespoke Per-Route Interactive Vector & Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
