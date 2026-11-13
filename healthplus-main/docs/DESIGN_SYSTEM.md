# HEALTH PLUS — Design System & Visual Token Specification

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Author:** CASA Vital Design System Engineering  

---

## 1. Design Token Architecture

HEALTH PLUS enforces a strict design token hierarchy. Raw hex codes and arbitrary Tailwind numbers are forbidden in component files. All components consume semantic tokens mapped to the master brand palette.

### 1.1 Color Tokens

```css
:root {
  /* Brand Master Foundation */
  --hp-forest-900: #0B241E;
  --hp-forest-800: #123B32;  /* Brand Primary Dark */
  --hp-forest-700: #1A4F44;
  --hp-forest-600: #246557;

  --hp-emerald-700: #115942;
  --hp-emerald-600: #187A5B;  /* Brand Primary Accent */
  --hp-emerald-500: #22A078;
  --hp-emerald-400: #34C797;
  --hp-emerald-100: #E3F8F0;

  --hp-sage-300: #BFDACE;
  --hp-sage-200: #DDECE3;    /* Brand Muted Neutral */
  --hp-sage-100: #EDF5F1;
  --hp-sage-50:  #F6FAF8;

  --hp-ivory-100: #FAF9F5;   /* Brand Primary Canvas */
  --hp-ivory-50:  #FFFFFF;

  --hp-gold-600: #C7974E;
  --hp-gold-500: #E7B76B;    /* Brand Highlight Accent */
  --hp-gold-400: #F0C988;
  --hp-gold-100: #FCF4E8;

  /* Functional UI Mappings */
  --bg-app: var(--hp-ivory-100);
  --bg-surface: var(--hp-ivory-50);
  --bg-surface-elevated: #FFFFFF;
  --bg-surface-muted: var(--hp-sage-100);
  --bg-surface-dark: var(--hp-forest-800);

  --text-heading: var(--hp-forest-800);
  --text-body: #2B423B;
  --text-muted: #5D7A71;
  --text-inverted: var(--hp-ivory-100);

  --border-subtle: rgba(18, 59, 50, 0.08);
  --border-focus: var(--hp-emerald-600);
  --border-card: rgba(18, 59, 50, 0.06);

  --status-success: var(--hp-emerald-600);
  --status-warning: #D9822B;
  --status-danger: #D14343;
  --status-info: #23789E;
}
```

---

## 2. Typography Specification

### 2.1 Font Families
- **Display & Headings:** `font-heading` -> `'Manrope', -apple-system, sans-serif`
  - High geometric clarity, friendly open counters, distinct modern health-tech posture.
- **Body & Data:** `font-sans` -> `'Inter', -apple-system, sans-serif`
  - Highly optimized tabular numbers (`font-feature-settings: 'tnum'`), exceptional micro-legibility at 12–14px.

### 2.2 Typographic Hierarchy & Utility Classes
| Level | Font Family | Size | Weight | Line Height | Tracking | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-hero` | Manrope | 4.0rem (64px) | 800 | 1.05 | -0.03em | Landing Hero Main Headline |
| `heading-1` | Manrope | 2.25rem (36px) | 700 | 1.15 | -0.02em | Page Titles (Dashboard, Studio) |
| `heading-2` | Manrope | 1.75rem (28px) | 700 | 1.25 | -0.015em | Section Dividers, Module Titles |
| `heading-3` | Manrope | 1.25rem (20px) | 600 | 1.35 | -0.01em | Card Titles, Modal Headers |
| `body-lg` | Inter | 1.125rem (18px)| 400 | 1.6 | normal | Hero descriptions, Lead paragraphs |
| `body-base` | Inter | 1.0rem (16px) | 400 | 1.5 | normal | General body text, form descriptions |
| `body-sm` | Inter | 0.875rem (14px)| 500 | 1.4 | normal | Table cells, helper text, nav links |
| `caption` | Inter | 0.75rem (12px) | 600 | 1.3 | 0.04em | Badges, timestamps, metric units |

---

## 3. Spacing & Grid System

- **Base Spacing Unit:** 4px (Tailwind standard scale `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px`).
- **Container Maximum Widths:**
  - Content / Article: `max-w-4xl (896px)`
  - Standard App Container: `max-w-7xl (1280px)`
  - Landing Screen Full-Bleed: `max-w-[1440px]`
- **Section Vertical Padding:**
  - Landing Sections: `py-20 md:py-28 lg:py-32`
  - In-App Dashboard Panels: `py-6 md:py-8`

---

## 4. UI Component Specifications

### 4.1 Buttons
- **Primary Button (`variant="primary"`):**
  - Background: `bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]`
  - Text: `text-white font-medium`
  - Shadow: `shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/15`
  - Radius: `rounded-full` (Pill shape for friendly, modern wellness identity)
  - Padding: `px-6 py-3 text-sm`
- **Secondary Button (`variant="secondary"`):**
  - Background: `bg-sage-100 hover:bg-sage-200 text-forest-800`
  - Border: `border border-forest-800/10`
  - Radius: `rounded-full`
- **Ghost Button (`variant="ghost"`):**
  - Background: `hover:bg-forest-800/5 text-forest-800`
  - Radius: `rounded-full`
- **Gold Accent Action (`variant="gold"`):**
  - Background: `bg-gold-500 hover:bg-gold-600 text-forest-900 font-semibold shadow-gold-glow`

### 4.2 Cards
- **Standard Surface Card:**
  - Background: `bg-white`
  - Border: `border border-forest-800/6`
  - Radius: `rounded-2xl`
  - Shadow: `0 4px 20px -2px rgba(18, 59, 50, 0.04)`
  - Padding: `p-6`
- **Highlighted / Active Pattern Card:**
  - Background: `bg-gradient-to-br from-white via-sage-50 to-emerald-50/30`
  - Border: `border-2 border-emerald-600/30`
  - Shadow: `0 12px 32px -4px rgba(24, 122, 91, 0.12)`

### 4.3 Form Inputs & Selectors
- **Input Fields:**
  - Background: `bg-white focus:bg-white`
  - Border: `border border-forest-800/15 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20`
  - Height: `h-11 (44px)`
  - Radius: `rounded-xl`
  - Typography: `text-forest-900 placeholder:text-forest-800/40 text-sm`
- **Sliders (Portion / Activity):**
  - Track: `h-2 bg-sage-200 rounded-full`
  - Thumb: `w-5 h-5 bg-emerald-600 border-2 border-white shadow-md focus:scale-110`

### 4.4 Badges & Status Chips
- **Confidence Badge:** `px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800`
- **Allergy Exclusion Tag:** `px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200`
- **Evidence Pill:** `px-3 py-1 rounded-full text-xs font-medium bg-sage-100 text-forest-800 hover:bg-sage-200 cursor-pointer`

---

## 5. Iconography & Visual Assets

- **Icon Family:** `lucide-react`
  - Stroke width: `1.75px` consistent across all icons.
  - Sizing: Standard UI = `18px`, Navigation = `20px`, Hero Highlights = `24px`.
- **Illustrations:**
  - Dual-tone line vector illustrations incorporating Forest Green (`#123B32`) outlines and soft Sage/Gold fills.
  - Custom SVG assets for food categories, pose angles, and pattern networks.

---

## 6. Accessibility & Contrast Compliance

- **Contrast Ratios:**
  - Deep Forest Green (`#123B32`) on Warm Ivory (`#FAF9F5`): `11.4:1` (Exceeds WCAG AAA requirement of 7:1).
  - Emerald (`#187A5B`) on Warm Ivory (`#FAF9F5`): `4.8:1` (Exceeds WCAG AA requirement of 4.5:1 for body, AAA for large text).
  - White on Emerald (`#187A5B`): `4.6:1` (Exceeds WCAG AA).
- **Keyboard Navigation:** Every interactive button, input, and modal features a high-visibility focus ring (`ring-2 ring-emerald-600 ring-offset-2`).
- **Screen Reader Support:** All custom metric charts, radial meters, and status icons carry explicit `aria-label`, `role="img"`, or `aria-valuenow` attributes.

