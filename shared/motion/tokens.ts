export const motionTokens = {
  duration: {
    none: 0,
    instant: 0.08,
    fast: 0.15,
    normal: 0.2,
    slow: 0.25,
    deliberate: 0.6,
  },
  easing: {
    standard: [0.16, 1, 0.3, 1],
    sharp: [0.4, 0, 0.2, 1],
    smooth: [0.22, 1, 0.36, 1],
    linear: [0, 0, 1, 1],
  },
  distance: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  scale: {
    subtle: 0.99,
    press: 0.98,
    pop: 1.02,
  },
} as const;

export const springs = {
  snappy: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 120, damping: 14 },
  bouncy: { type: "spring", stiffness: 400, damping: 10 },
  instant: { type: "spring", stiffness: 600, damping: 35 },
  release: {
    type: "spring",
    stiffness: 200,
    damping: 20,
    restDelta: 0.001,
  },
} as const;

export const MotionStepDirection = {
  FORWARD: "forward",
  BACKWARD: "backward",
} as const;

export type MotionStepDirection =
  (typeof MotionStepDirection)[keyof typeof MotionStepDirection];
