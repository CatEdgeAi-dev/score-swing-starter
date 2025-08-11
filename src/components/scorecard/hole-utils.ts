// Utilities for safe hole access and defaults
import type { HoleData } from './ScorecardContext';

const defaultPars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4] as const;

export function makeSafeHole(hole: HoleData | undefined, holeNumber: number): HoleData {
  const par = defaultPars[holeNumber - 1] ?? 4;
  return {
    strokes: hole?.strokes ?? 0,
    putts: hole?.putts ?? 0,
    fairwayHit: hole?.fairwayHit ?? false,
    greenInRegulation: hole?.greenInRegulation ?? false,
    upAndDown: hole?.upAndDown ?? false,
    notes: hole?.notes ?? '',
    par: hole?.par ?? par,
  };
}
