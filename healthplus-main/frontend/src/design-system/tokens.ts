/**
 * HEALTH PLUS — Centralized Design System Tokens
 * Strictly implements the CASA Vital brand palette and design language.
 */

export const brandColors = {
  forest: {
    DEFAULT: '#123B32',
    dark: '#0B241E',
    light: '#1A4F44',
    surface: 'rgba(18, 59, 50, 0.05)',
  },
  emerald: {
    DEFAULT: '#187A5B',
    light: '#22A078',
    dark: '#115942',
    surface: 'rgba(24, 122, 91, 0.12)',
  },
  sage: {
    DEFAULT: '#DDECE3',
    soft: '#EEF5F1',
    border: 'rgba(18, 59, 50, 0.12)',
  },
  ivory: {
    DEFAULT: '#FAF9F5',
    card: '#FFFFFF',
    subtle: '#F3F1E9',
  },
  gold: {
    DEFAULT: '#E7B76B',
    hover: '#D8A252',
    surface: 'rgba(231, 183, 107, 0.16)',
  },
  status: {
    success: '#187A5B',
    warning: '#D9822B',
    danger: '#D14343',
    info: '#23789E',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  section: '96px',
} as const;

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    heading: "'Manrope', -apple-system, sans-serif",
    sans: "'Inter', -apple-system, sans-serif",
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

export const zIndex = {
  background: -10,
  ambient: 0,
  base: 1,
  header: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;
