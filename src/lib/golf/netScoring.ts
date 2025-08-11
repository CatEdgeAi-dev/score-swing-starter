// Simple helpers for net scoring; keep pure.
export function netScore(gross: number, strokes: number): number {
  return gross - strokes;
}
