export const motionTiming = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
export const reveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: motionTiming,
};
