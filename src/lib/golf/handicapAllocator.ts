import { Player, Segment, HandicapPlan, Side, PerHoleStrokes } from './types';

/**
 * Allocate handicap strokes by:
 * 1) Lowest CH plays scratch; others get a pool = CH - lowest.
 * 2) Split each pool evenly across segments (remainder distributed 1-by-1 starting from segment 1).
 * 3) Within each segment, assign strokes to holes by Stroke Index order (hardest first). Cycle if needed.
 */
export function allocateStrokes(players: Player[], segments: Segment[]): HandicapPlan {
  throw new Error('not implemented');
}

// Helper: zero maps for each side/each hole.
export function initPerHole(holes: number[]): Record<Side, PerHoleStrokes> {
  const init: Record<Side, PerHoleStrokes> = { A: {}, B: {} };
  for (const h of holes) {
    init.A[h] = 0;
    init.B[h] = 0;
  }
  return init;
}
