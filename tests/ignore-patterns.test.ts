import { describe, expect, it } from 'vitest';
import { shouldIgnoreFile } from '../src/independent';

describe('shouldIgnoreFile', () => {
  it('matches a file path when any pattern matches', () => {
    expect(
      shouldIgnoreFile('Notes/Journal.md', ['^Notes/', 'Daily/.*\\.md$']),
    ).toBe(true);
  });

  it('returns false when no pattern matches', () => {
    expect(
      shouldIgnoreFile('Projects/Plan.md', ['^Notes/', 'Daily/.*\\.md$']),
    ).toBe(false);
  });
});
