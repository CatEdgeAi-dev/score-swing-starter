import { HoleOutcome, ThirtyTenTenOutcome } from './types';

/**
 * Evaluate 30-10-10 frames given the sequence of hole outcomes (A/B/H) for a 9-hole match.
 * Rules:
 * - Main (RM30): standard match play; winner must clinch before final hole; else void.
 * - Dormie (RM10): when lead == holes remaining, starts NEXT hole; trigger hole doesn't count. Winner = most holes won in that mini-match; tie = void.
 * - Bye (RM10): when Main is clinched early, starts NEXT hole; trigger hole doesn't count. Winner = most holes won; tie = void.
 * - Dormie and Bye can overlap and both ignore their trigger holes.
 */
export function evaluateThirtyTenTen(holeOutcomes: HoleOutcome[]): ThirtyTenTenOutcome {
  throw new Error('not implemented');
}
