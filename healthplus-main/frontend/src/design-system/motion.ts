/**
 * HEALTH PLUS — Motion System & Animation Presets
 * Clean, performant Framer Motion variants and transitions.
 */

export const transitions = {
  // Snappy yet organic deceleration
  smoothDecel: {
    duration: 0.65,
    ease: [0.22, 1, 0.36, 1],
  },
  // Micro-interaction hover
  micro: {
    duration: 0.2,
    ease: 'easeOut',
  },
  // Dialog and drawer transitions
  modal: {
    duration: 0.35,
    ease: [0.16, 1, 0.3, 1],
  },
  // Natural spring
  springNatural: {
    type: 'spring',
    stiffness: 280,
    damping: 26,
  },
  // Bouncy spring for badges & counters
  springBouncy: {
    type: 'spring',
    stiffness: 420,
    damping: 20,
  },
} as const;

export const motionVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.smoothDecel,
    },
  },

  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },

  scaleIn: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: transitions.smoothDecel,
    },
  },

  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },

  staggerItem: {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.smoothDecel,
    },
  },

  cardHover: {
    initial: { y: 0, scale: 1 },
    hover: {
      y: -4,
      transition: transitions.micro,
    },
    tap: {
      y: -1,
      scale: 0.99,
      transition: { duration: 0.1 },
    },
  },

  modalBackdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },

  modalContent: {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: transitions.modal,
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      y: 12,
      transition: { duration: 0.2 },
    },
  },
};
