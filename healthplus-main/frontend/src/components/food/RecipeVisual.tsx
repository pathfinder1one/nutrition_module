import React from 'react';
import type { RecipeVisualTheme } from '@/types/wellness';

export interface RecipeVisualProps {
  theme: RecipeVisualTheme;
  className?: string;
  imageUrl?: string;
  name?: string;
}

const THEME_PALETTES: Record<
  RecipeVisualTheme,
  { bg: string; main: string; accent: string; swirl: string; garnish: string; bowl: string }
> = {
  dal_bowl: {
    bg: 'from-amber-100/80 to-emerald-50 dark:from-amber-950/40 dark:to-[#0A1F17]',
    bowl: '#1B4332',
    main: '#F59E0B',
    accent: '#D97706',
    swirl: '#B45309',
    garnish: '#10B981',
  },
  paneer_skillet: {
    bg: 'from-orange-100/80 to-amber-50 dark:from-orange-950/40 dark:to-[#0A1F17]',
    bowl: '#263238',
    main: '#EA580C',
    accent: '#FEF3C7',
    swirl: '#FDE68A',
    garnish: '#16A34A',
  },
  soya_stir: {
    bg: 'from-amber-100/80 to-stone-100 dark:from-amber-950/40 dark:to-[#0A1F17]',
    bowl: '#1F2937',
    main: '#C2410C',
    accent: '#D97706',
    swirl: '#FBBF24',
    garnish: '#22C55E',
  },
  poha_plate: {
    bg: 'from-yellow-100/80 to-lime-50 dark:from-yellow-950/40 dark:to-[#0A1F17]',
    bowl: '#166534',
    main: '#FACC15',
    accent: '#A16207',
    swirl: '#EF4444',
    garnish: '#15803D',
  },
  chilla_platter: {
    bg: 'from-emerald-100/80 to-amber-50 dark:from-emerald-950/40 dark:to-[#0A1F17]',
    bowl: '#123B32',
    main: '#D97706',
    accent: '#F59E0B',
    swirl: '#92400E',
    garnish: '#10B981',
  },
  khichdi_pot: {
    bg: 'from-yellow-100/80 to-emerald-50 dark:from-amber-950/40 dark:to-[#0A1F17]',
    bowl: '#1E293B',
    main: '#EAB308',
    accent: '#EA580C',
    swirl: '#FDE047',
    garnish: '#16A34A',
  },
  egg_bhurji: {
    bg: 'from-amber-100/80 to-rose-50 dark:from-amber-950/40 dark:to-[#0A1F17]',
    bowl: '#334155',
    main: '#FBBF24',
    accent: '#EF4444',
    swirl: '#FEF08A',
    garnish: '#22C55E',
  },
  oats_bowl: {
    bg: 'from-stone-100 to-emerald-50 dark:from-emerald-950/50 dark:to-[#0A1F17]',
    bowl: '#123B32',
    main: '#E7E5E4',
    accent: '#F59E0B',
    swirl: '#A8A29E',
    garnish: '#16A34A',
  },
  curd_rice: {
    bg: 'from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-[#0A1F17]',
    bowl: '#0F4C3A',
    main: '#FAF9F5',
    accent: '#F97316',
    swirl: '#D6D3D1',
    garnish: '#16A34A',
  },
  sprouts_chaat: {
    bg: 'from-lime-100/80 to-emerald-50 dark:from-emerald-950/40 dark:to-[#0A1F17]',
    bowl: '#1B4332',
    main: '#84CC16',
    accent: '#EF4444',
    swirl: '#A16207',
    garnish: '#15803D',
  },
  chicken_bowl: {
    bg: 'from-rose-100/70 to-amber-50 dark:from-rose-950/35 dark:to-[#0A1F17]',
    bowl: '#1E293B',
    main: '#B45309',
    accent: '#F59E0B',
    swirl: '#78350F',
    garnish: '#10B981',
  },
  ragi_dosa: {
    bg: 'from-stone-200/80 to-amber-50 dark:from-stone-900/50 dark:to-[#0A1F17]',
    bowl: '#0F4C3A',
    main: '#78350F',
    accent: '#F5F5F4',
    swirl: '#451A03',
    garnish: '#10B981',
  },
  tofu_stir: {
    bg: 'from-emerald-100/80 to-amber-50 dark:from-emerald-950/50 dark:to-[#0A1F17]',
    bowl: '#1E293B',
    main: '#15803D',
    accent: '#FEF3C7',
    swirl: '#DC2626',
    garnish: '#4ADE80',
  },
  roti_sabzi: {
    bg: 'from-amber-100/80 to-emerald-50 dark:from-amber-950/40 dark:to-[#0A1F17]',
    bowl: '#123B32',
    main: '#D97706',
    accent: '#FBBF24',
    swirl: '#92400E',
    garnish: '#16A34A',
  },
};

const THEME_FOOD_IMAGES: Record<RecipeVisualTheme, string> = {
  chilla_platter: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  dal_bowl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  khichdi_pot: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=600&q=80',
  oats_bowl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
  paneer_skillet: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  egg_bhurji: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  curd_rice: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  poha_plate: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  soya_stir: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  sprouts_chaat: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  chicken_bowl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  ragi_dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
  tofu_stir: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  roti_sabzi: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
};

export const RecipeVisual: React.FC<RecipeVisualProps> = ({
  theme,
  className = '',
  imageUrl,
  name,
}) => {
  const p = THEME_PALETTES[theme] ?? THEME_PALETTES.dal_bowl;
  const foodImg = imageUrl || THEME_FOOD_IMAGES[theme];
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.bg} flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {foodImg && !hasError ? (
        <div className="relative w-full h-full min-h-[96px] overflow-hidden rounded-2xl">
          <img
            src={foodImg}
            alt={name || theme}
            loading="lazy"
            onError={() => setHasError(true)}
            className="w-full h-full min-h-[96px] object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
      <svg viewBox="0 0 180 110" className="w-full h-24 drop-shadow-sm p-3">
        {/* Soft plate shadow */}
        <ellipse cx="90" cy="61" rx="52" ry="40" fill="rgba(18,59,50,0.14)" />
        {/* Outer stoneware rim */}
        <circle cx="90" cy="56" r="42" fill={p.bowl} />
        <circle cx="90" cy="56" r="37" fill="#FAF9F5" opacity="0.14" />
        {/* Main dish fill */}
        <circle cx="90" cy="56" r="34" fill={p.main} />

        {/* Dish-specific textures */}
        {(theme === 'paneer_skillet' || theme === 'tofu_stir' || theme === 'chicken_bowl') && (
          <>
            <rect x="70" y="40" width="12" height="12" rx="3" fill={p.accent} transform="rotate(14 76 46)" />
            <rect x="95" y="42" width="11" height="11" rx="3" fill={p.accent} transform="rotate(-12 100 47)" />
            <rect x="81" y="59" width="13" height="12" rx="3" fill={p.accent} transform="rotate(8 87 65)" />
            <circle cx="106" cy="61" r="4" fill={p.swirl} />
            <circle cx="72" cy="60" r="3.5" fill={p.swirl} />
          </>
        )}

        {(theme === 'dal_bowl' || theme === 'khichdi_pot' || theme === 'curd_rice') && (
          <>
            <path
              d="M72 48 Q90 38 106 52 Q92 68 74 62"
              fill="none"
              stroke={p.swirl}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="88" cy="48" r="3" fill={p.accent} />
            <circle cx="98" cy="62" r="2.5" fill={p.accent} />
            <circle cx="78" cy="60" r="2.5" fill={p.accent} />
          </>
        )}

        {(theme === 'chilla_platter' || theme === 'roti_sabzi' || theme === 'ragi_dosa') && (
          <>
            <circle cx="84" cy="56" r="23" fill={p.accent} opacity="0.85" />
            <path d="M68 50 Q84 44 98 54" stroke={p.swirl} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M72 62 Q86 58 96 66" stroke={p.swirl} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Side katori of chutney/dahi */}
            <circle cx="136" cy="70" r="14" fill={p.bowl} />
            <circle cx="136" cy="70" r="10.5" fill={p.garnish} />
          </>
        )}

        {(theme === 'poha_plate' || theme === 'sprouts_chaat' || theme === 'soya_stir' || theme === 'egg_bhurji' || theme === 'oats_bowl') && (
          <>
            <circle cx="78" cy="48" r="5" fill={p.accent} />
            <circle cx="99" cy="49" r="4.5" fill={p.accent} />
            <circle cx="90" cy="64" r="5" fill={p.accent} />
            <circle cx="76" cy="62" r="4" fill={p.swirl} />
            <circle cx="103" cy="61" r="3.5" fill={p.swirl} />
          </>
        )}

        {/* Fresh coriander / herb garnish */}
        <ellipse cx="90" cy="54" rx="4" ry="2.2" fill={p.garnish} transform="rotate(-25 90 54)" />
        <ellipse cx="95" cy="57" rx="3.5" ry="2" fill={p.garnish} transform="rotate(20 95 57)" />
      </svg>
      )}
    </div>
  );
};
