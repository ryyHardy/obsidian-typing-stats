import { describe, expect, it } from 'vitest';
import { daysWithStats } from '../src/lib/stats';

describe('daysWithStats', () => {
  it('only returns entries that contain all requested stats', () => {
    const history = {
      '2026-01-01': {
        activeSeconds: 10,
        addedChars: 100,
        deletedChars: 3,
        bursts: 1,
        corrections: 2,
      },
      '2026-01-02': {
        activeSeconds: 20,
        addedChars: 200,
        deletedChars: 4,
        bursts: 2,
      },
      '2026-01-03': {
        activeSeconds: 30,
        addedChars: 300,
        deletedChars: 5,
        bursts: 3,
        corrections: 4,
      },
      '2026-01-04': {
        activeSeconds: 30,
        addedChars: 300,
        deletedChars: 5,
      },
    };

    expect(daysWithStats(history, 'corrections', 'bursts')).toEqual([
      expect.objectContaining({ corrections: 2, bursts: 1 }),
      expect.objectContaining({ corrections: 4, bursts: 3 }),
    ]);
  });
});
