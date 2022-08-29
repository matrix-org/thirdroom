export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
export const clamp = (min: number, max: number, a: number) => Math.min(max, Math.max(min, a));
export const invlerp = (x: number, y: number, a: number) => clamp(0, 1, (a - x) / (y - x));
export const range = (x1: number, y1: number, x2: number, y2: number, a: number) => lerp(x2, y2, invlerp(x1, y1, a));

// src: https://en.wikipedia.org/wiki/Smoothstep
export function smoothstep(min: number, max: number, alpha: number) {
  if (alpha < min) return 0;
  if (alpha >= max) return 1;
  alpha = (alpha - min) / (max - min);
  return alpha * alpha * (3 - 2 * alpha);
}
export function smootherstep(min: number, max: number, alpha: number) {
  if (alpha <= min) return 0;
  if (alpha >= max) return 1;
  alpha = (alpha - min) / (max - min);
  return alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10);
}
