export const animation = {
  duration: {
    fast: 150,
    normal: 280,
    slow: 480,
    page: 380,
  },
  spring: {
    default: { damping: 18, stiffness: 180 },
    bouncy: { damping: 12, stiffness: 200 },
    snappy: { damping: 22, stiffness: 300 },
  },
} as const;
