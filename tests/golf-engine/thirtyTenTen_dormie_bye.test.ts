import { evaluateThirtyTenTen } from '../../src/lib/golf/thirtyTenTen';

describe('30-10-10 frame logic', () => {
  it('triggers Dormie then clinches Main, then runs Bye; trigger holes never count', () => {
    // Sequence (9 holes): At H6 A goes 3-up with 3 to play (Dormie triggers; starts at H7).
    // H7 A wins → Main clinched (4-up with 2 to play); Bye starts at H8.
    // H8 B wins; H9 B wins → Dormie: B wins 1-up; Bye: B wins 2-up. Main stays with A.
    const outcomes = ['A','A','H','B','A','A','A','B','B'] as const;
    const res = evaluateThirtyTenTen(outcomes.slice() as any);
    expect(res.main.winner).toBe('A');
    expect(res.dormie?.winner).toBe('B');
    expect(res.bye?.winner).toBe('B');
  });

  it('voids Main if never clinched before the last hole', () => {
    // A edges ahead only at the final hole; by rule, Main is void.
    const outcomes = ['H','B','H','A','H','A','H','H','A'] as const;
    const res = evaluateThirtyTenTen(outcomes.slice() as any);
    expect(res.main.winner).toBeNull(); // void
  });
});
