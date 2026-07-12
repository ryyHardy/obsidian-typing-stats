import type { TypingStatsSettings } from './settings';

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

export type DailyStats = {
  date: string;
  activeSeconds: number; // sum of burst durations
  addedChars: number;
  deletedChars: number;
  bursts: number;
  avgWPM: number; // weighted by duration
  corrections: number;
};

export type TypingStatsData = {
  settings: TypingStatsSettings;
  history: Record<string, DailyStats>; // key is date of format `YYYY-MM-DD
};
