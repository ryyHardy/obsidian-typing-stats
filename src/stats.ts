import { EditEvent, DailyStats } from './types';

/**
 * Calculates the WPM of a burst
 * @param burst Burst as a list of edits
 * @param minWindowMs The burst duration to use if the burst lasts shorter than this (accounts for very shorts bursts and makes WPM more sensible early in a burst)
 * @returns The WPM calculated by dividing net characters by 5 and again by the duration in minutes
 */
export function burstWPM(burst: EditEvent[], minWindowMs = 3000): number {
  if (burst.length === 0) return 0;

  const first = burst[0]!;
  const last = burst[burst.length - 1]!;

  const elapsed = last.timestamp - first.timestamp;

  const durationMinutes = Math.max(elapsed, minWindowMs) / 60000;
  const netChars = burst.reduce(
    (sum, e) => sum + e.insertedText.length - e.deletedText.length,
    0,
  );
  return Math.max(0, netChars) / 5 / durationMinutes;
}

export function isBackwardJump(prev: EditEvent, curr: EditEvent): boolean {
  return curr.deletedFrom < prev.insertedTo;
}

/**
 * True if `curr` deletes text that overlaps with what `prev` just inserted,
 * within a short time window (i.e. immediate correction after a mistake)
 * @param prev The previous edit
 * @param curr The current edit
 * @param maxGapMs The highest gap between
 * @returns
 */
export function isCorrection(
  prev: EditEvent,
  curr: EditEvent,
  maxGapMs = 1000,
): boolean {
  if (curr.timestamp - prev.timestamp > maxGapMs) return false;
  if (curr.deletedText.length === 0) return false; // must actually delete something

  // Whether the deletion range overlaps the insertion range
  return (
    curr.deletedFrom < prev.insertedTo && curr.deletedTo > prev.insertedFrom
  );
}

export function emptyDailyStats(date: string): DailyStats {
  return {
    date,
    activeSeconds: 0,
    addedChars: 0,
    deletedChars: 0,
    bursts: 0,
    avgWPM: 0,
    corrections: 0,
  };
}

export function addBurstToDailyStats(stats: DailyStats, burst: EditEvent[]) {
  if (burst.length === 0) return;

  // Duration in seconds
  const duration = Math.trunc(
    (burst[burst.length - 1]!.timestamp - burst[0]!.timestamp) / 1000,
  );

  const wpm = burstWPM(burst);

  let addedChars = 0;
  let deletedChars = 0;
  let corrections = 0;

  for (let i = 0; i < burst.length; i++) {
    const e = burst[i]!;
    addedChars += e.insertedText.length;
    deletedChars += e.deletedText.length;
    if (i > 0 && isCorrection(burst[i - 1]!, e)) corrections++;
  }

  // Weighted-average WPM (running average, floored)
  stats.avgWPM = Math.floor(
    stats.activeSeconds + duration === 0
      ? 0
      : (stats.avgWPM * stats.activeSeconds + wpm * duration) /
          (stats.activeSeconds + duration),
  );

  stats.activeSeconds += duration;
  stats.addedChars += addedChars;
  stats.deletedChars += deletedChars;
  stats.bursts += 1;
  stats.corrections += corrections;
}

// TODO: Consider whether we should count pasting/autocompletion events into stats. Right now, we do
export function shouldDiscardBurst(
  burst: EditEvent[],
  minBurstDuration: number,
): boolean {
  if (burst.length === 0) return true;

  const duration = burst[burst.length - 1]!.timestamp - burst[0]!.timestamp;
  if (duration >= minBurstDuration) return false;

  // accounts for instant actions like paste, autocomplete, etc.
  const charsChanged = burst.reduce(
    (sum, e) => sum + e.insertedText.length + e.deletedText.length,
    0,
  );

  const TRIVIAL_EDIT_CHARS = 1; // don't count single stray characters typed
  return charsChanged <= TRIVIAL_EDIT_CHARS;
}
