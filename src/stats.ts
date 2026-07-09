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

export function emptyDailyStats(date: string): DailyStats {
	return {
		date,
		totalActiveMs: 0,
		totalAddedChars: 0,
		totalDeletedChars: 0,
		burstCount: 0,
		avgWPM: 0,
		errorEvents: 0,
	};
}

export function addBurstToDailyStats(stats: DailyStats, burst: EditEvent[]) {
	if (burst.length === 0) return;

	const duration = burst[burst.length - 1]!.timestamp - burst[0]!.timestamp;

	const wpm = burstWPM(burst);

	let addedChars = 0;
	let deletedChars = 0;
	let errorEvents = 0;

	for (let i = 0; i < burst.length; i++) {
		const e = burst[i]!;
		addedChars += e.insertedText.length;
		deletedChars += e.deletedText.length;
		if (i > 0 && isBackwardJump(burst[i - 1]!, e)) errorEvents++;
	}

	// Weighted-average WPM (running average, floored)
	stats.avgWPM = Math.floor(
		stats.totalActiveMs + duration === 0
			? 0
			: (stats.avgWPM * stats.totalActiveMs + wpm * duration) /
					(stats.totalActiveMs + duration),
	);

	stats.totalActiveMs += duration;
	stats.totalAddedChars += addedChars;
	stats.totalDeletedChars += deletedChars;
	stats.burstCount += 1;
	stats.errorEvents += errorEvents;
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
