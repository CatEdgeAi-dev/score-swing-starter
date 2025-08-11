import { allocateStrokes } from '../../src/lib/golf/handicapAllocator';
import type { Player, Segment } from '../../src/lib/golf/types';

describe('handicapAllocator', () => {
  it('splits pools evenly per segment and assigns to hardest holes in each segment first', () => {
    const players: Player[] = [
      { id: 'pA', name: 'A', courseHandicap: 12, side: 'A' },
      { id: 'pB', name: 'B', courseHandicap: 9, side: 'B' }, // scratch (lowest)
    ];
    const segments: Segment[] = [
      { id: 's1', holes: [1, 2, 3], strokeIndexByHole: { 1: 1, 2: 5, 3: 9 } },
      { id: 's2', holes: [4, 5, 6], strokeIndexByHole: { 4: 2, 5: 6, 6: 8 } },
      { id: 's3', holes: [7, 8, 9], strokeIndexByHole: { 7: 3, 8: 7, 9: 4 } },
    ];
    // CH diff = 3 → pool of 3 for side A → 1 stroke per 3-hole segment at the hardest hole
    const plan = allocateStrokes(players, segments);
    expect(plan.strokesBySide.A[1]).toBe(1); // hardest in s1 (SI 1)
    expect(plan.strokesBySide.A[4]).toBe(1); // hardest in s2 (SI 2)
    expect(plan.strokesBySide.A[7]).toBe(1); // hardest in s3 (SI 3)
    // all other holes 0
    for (const h of [2,3,5,6,8,9]) {
      expect(plan.strokesBySide.A[h]).toBe(0);
    }
    // scratch side gets 0 everywhere
    for (const h of [1,2,3,4,5,6,7,8,9]) {
      expect(plan.strokesBySide.B[h]).toBe(0);
    }
  });
});
