import type { TypingStatsSettings } from '../settings';

export type EditEvent = {
  timestamp: number; // Date.now()
  fileKey: string;

  deletedFrom: number;
  deletedTo: number;
  deletedText: string;
  insertedFrom: number;
  insertedTo: number;
  insertedText: string;

  selectionBefore: { anchor: number; head: number };
  selectionAfter: { anchor: number; head: number };
};

/**
 * ! IMPORTANT: Only store 'atomic' stats that add completely new information.
 * EX: WPM should NOT be stored. It is just a combination of already-stored stats (active time, added/deleted chars)
 */

export type DailyStats = {
  date: string;
  activeSeconds: number;
  addedChars: number;
  deletedChars: number;
  bursts: number;
  corrections: number;
};

export type PartialDailyStats = Partial<DailyStats>;

export type TypingStatsData = {
  schemaVersion: number;
  settings: TypingStatsSettings;
  history: Record<string, DailyStats>; // key is date of format `YYYY-MM-DD`
};
