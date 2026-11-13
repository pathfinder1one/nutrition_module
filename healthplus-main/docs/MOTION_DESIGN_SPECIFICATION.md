# HEALTH PLUS — Motion Design & Visual Effects Specification

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Author:** CASA Vital Motion & Creative Technology  

---

## 1. Motion Philosophy & Core Principles

At HEALTH PLUS, motion is not decorative icing applied after the fact; it is a structural pillar that makes complex health data feel living, intuitive, and reassuring.

### 1.1 Four Motion Pillars
1. **Organic & Biometric:** Transitions emulate natural human rhythms (breathing cadences, gentle fluid currents) rather than robotic, linear mechanical movements.
2. **Context-Differentiated:** Each module receives a distinct ambient treatment suited to its mental state:
   - *Landing:* Inspiring, multi-layered depth, orbital kinetic energy.
   - *Dashboard:* Quiet, grounding, subtle ambient orbs that never distract from data consumption.
   - *Food Scanner:* Precision optics, scanning sweeps, smooth portion scaling.
   - *Exercise Studio:* High-utility real-time skeleton responsiveness (60 FPS HUD), zero decorative clutter over camera.
   - *Pattern Intelligence:* Connected synapses, node illumination, progressive evidence expansion.
   - *AI Coach:* Gentle, restrained pulsing presence indicating thought and responsiveness.
3. **Performance First:** All animations strictly target GPU-accelerated CSS properties (`transform: translate3d`, `opacity`, `scale`). Layout shifts (`top`, `left`, `margin`) are prohibited in animation loops.
4. **Accessible by Default:** Full, unconditional compliance with `prefers-reduced-motion`. When reduced motion is requested, all ambient drifting stops, transitions become instantaneous crossfades, and 3D scenes revert to elegant static renders.

---

## 2. Animated Background Treatments by Module

| Screen / Module | Background Treatment | Visual Layering | Animation Technique | Frequency / Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Landing Hero** | *Tri-Orbital Wellness Core* | Dual concentric gold/emerald orbital rings + living translucent emerald mesh + drifting organic gradient blobs | Three.js / React Three Fiber + CSS radial gradients | 18s gentle orbit rotation; 12s pulsing breathing core |
| **Landing Features** | *Subtle Kinetic Grid* | Delicate 48px grid with glowing cursor proximity nodes | Canvas / CSS Radial Mask | Cursor-following proximity highlight |
| **Dashboard** | *Ambient Forest Mist* | Two large blurred ambient orbs (one Sage `#DDECE3` at top right, one Emerald `#187A5B` at bottom left) | Pure CSS `translate3d` with `blur(90px)` and 25% opacity | 20s infinite alternating ease-in-out drift |
| **Food Scanner** | *Optic Focus Field* | Dark frosted vignette (`bg-forest-900/60 backdrop-blur-sm`) with illuminated viewfinder crosshairs | Framer Motion + CSS linear scan line | 2s continuous vertical sweep cycle |
| **Exercise Studio** | *High-Contrast Canvas* | Deep slate/forest edge vignette framing the live camera stream for maximum landmark contrast | Canvas 2D overlay on `<video>` element | 60 FPS requestAnimationFrame |
| **Pattern Insights** | *Synaptic Intelligence Net* | Floating interconnected nodes that subtly shift position, illuminating when a pattern card is focused | SVG + Framer Motion spring physics | 8s gentle organic node tension drift |
| **AI Coach** | *Restrained Thought Waveform* | Subtle emerald aura expanding gently around coach avatar during message synthesis | CSS `keyframes` scale & opacity pulse | 3.5s breathing loop while generating |

---

## 3. CSS Ambient Background Architecture

```css
/* Layer 1: Ambient Living Gradients */
.hp-ambient-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background-color: var(--color-ivory);
}

.hp-ambient-orb-emerald {
  position: absolute;
  top: -10%;
  left: 15%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(24, 122, 91, 0.18) 0%, rgba(24, 122, 91, 0.0) 70%);
  filter: blur(80px);
  will-change: transform;
  animation: hp-drift-primary 22s ease-in-out infinite alternate;
}

.hp-ambient-orb-sage {
  position: absolute;
  bottom: -5%;
  right: 10%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(221, 236, 227, 0.35) 0%, rgba(221, 236, 227, 0.0) 75%);
  filter: blur(90px);
  will-change: transform;
  animation: hp-drift-secondary 26s ease-in-out infinite alternate;
}

.hp-ambient-orb-gold {
  position: absolute;
  top: 45%;
  left: 60%;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(231, 183, 107, 0.14) 0%, rgba(231, 183, 107, 0.0) 70%);
  filter: blur(75px);
  will-change: transform;
  animation: hp-drift-tertiary 18s ease-in-out infinite alternate;
}

@keyframes hp-drift-primary {
  0% { transform: translate3d(0, 0, 0) scale(1.0); }
  50% { transform: translate3d(60px, 45px, 0) scale(1.08); }
  100% { transform: translate3d(-30px, 80px, 0) scale(0.96); }
}

@keyframes hp-drift-secondary {
  0% { transform: translate3d(0, 0, 0) scale(1.0); }
  50% { transform: translate3d(-70px, -50px, 0) scale(1.12); }
  100% { transform: translate3d(40px, -30px, 0) scale(0.94); }
}

@keyframes hp-drift-tertiary {
  0% { transform: translate3d(0, 0, 0) scale(0.95); }
  100% { transform: translate3d(-50px, 40px, 0) scale(1.05); }
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  .hp-ambient-orb-emerald,
  .hp-ambient-orb-sage,
  .hp-ambient-orb-gold {
    animation: none !important;
    transform: none !important;
  }
}
```

---

## 4. Framer Motion Animation Standards

### 4.1 Global Transitions & Easings
- **Standard Entrance Easing:** `[0.22, 1, 0.36, 1]` (Custom snappy cubic-bezier, smooth deceleration).
- **Organic Spring:** `type: "spring", stiffness: 260, damping: 24`.
- **Micro-Interaction Spring:** `type: "spring", stiffness: 400, damping: 30`.

### 4.2 Standard Framer Motion Variants

```tsx
// Staggered Container for Lists and Grids
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

// Standard Section Scroll Reveal
export const sectionReveal = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Card Hover Scale & Lift
export const cardInteractiveHover = {
  initial: { y: 0, boxShadow: "0 4px 20px -2px rgba(18, 59, 50, 0.04)" },
  hover: { 
    y: -4, 
    boxShadow: "0 16px 36px -4px rgba(18, 59, 50, 0.10)",
    transition: { duration: 0.25, ease: "easeOut" }
  },
  tap: { y: -1, scale: 0.99 }
};

// Evidence Card Expansion
export const evidenceExpand = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  }
};
```

---

## 5. GSAP + ScrollTrigger Landing Storytelling

### 5.1 Journey Sequence
- **Target:** Section 6 (How HEALTH PLUS Works).
- **Mechanism:** As the user scrolls through the 3-step section, GSAP pins the left preview card while the right storytelling steps scroll past, smoothly morphing the central visual from *1. Observe (Camera Food Scan wireframe)* -> *2. Understand (Connecting data baseline graphs)* -> *3. Guide (Actionable personalized recommendation badge)*.
- **ScrollTrigger Configuration:**
  ```javascript
  gsap.to(".hp-journey-pin-container", {
    scrollTrigger: {
      trigger: "#how-it-works",
      start: "top top+=80",
      end: "+=1800",
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        updateStepActiveState(Math.floor(self.progress * 3));
      }
    }
  });
  ```

---

## 6. Three.js / React Three Fiber Wellness Core

### 6.1 Hero Visual Architecture
- **Component:** `<WellnessCoreCanvas />` mounted inside Landing Hero.
- **Scene Objects:**
  1. *Central Organism:* Icosahedron geometry with custom fragment shader rendering an emerald-forest organic noise displacement texture that gently breathes with a 4-second sine pulse.
  2. *Inner Gold Orbit:* Torus ring rotated at 35 degrees with reflective metallic roughness 0.2 and subtle gold emission.
  3. *Outer Emerald Orbit:* Counter-rotating thin torus ring tilted at -45 degrees.
- **Interactive Response:** Smooth mouse-position parallax rotation (damped using lerp factor 0.05).
- **Fallback:** On low-power devices (detected via WebGL capabilities) or when `prefers-reduced-motion` is active, the Canvas unmounts cleanly and renders a high-definition pre-rendered static SVG graphic.

---

## 7. Performance Budget & Verification

- **Frame Rate Target:** Constant 60 FPS on mid-range mobile devices (e.g., iPhone 12, Snapdragon 778G).
- **Bundle Impact:** Three.js and GSAP are dynamically imported via `React.lazy()` solely on the landing page, ensuring the authenticated dashboard bundle remains ultra-lightweight (< 180 KB initial JS).
- **Memory Management:** All Three.js geometries, materials, and textures are explicitly disposed of on component unmount to prevent WebGL memory leaks.

