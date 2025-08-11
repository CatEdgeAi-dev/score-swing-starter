export type Side = 'A' | 'B';
export type HoleOutcome = Side | 'H'; // A wins, B wins, or Halve

export interface Player {
  id: string;
  name: string;
  courseHandicap: number; // WHS Course Handicap for this round
  side: Side; // assign players to A or B; singles = one per side
}

export interface Segment {
  id: string;
  holes: number[]; // e.g., [1,2,3]
  // Stroke Index ranking for holes in this segment: lower = harder
  strokeIndexByHole: Record<number, number>;
}

export type PerHoleStrokes = Record<number, number>; // strokes given to the non-scratch side on that hole

export interface HandicapPlan {
  // per side per hole, number of handicap strokes
  strokesBySide: Record<Side, PerHoleStrokes>;
}

export interface FrameOutcome {
  winner: Side | null; // null = void
}

export interface ThirtyTenTenOutcome {
  main: FrameOutcome;
  dormie: FrameOutcome | null; // null if never triggered
  bye: FrameOutcome | null;    // null if never triggered
}

export interface MatchSnapshot {
  holes: number[];
  holeOutcomes: HoleOutcome[]; // length = holes.length
  frames: ThirtyTenTenOutcome;
}
