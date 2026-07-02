import { EditEvent, DailyStats } from './types';

/**
 * Divides an array of edit events into "bursts" based on their timing
 * @param changes The array of edits to divide
 * @param gapThreshold Smallest time gap (ms) needed to put the next edit into a new burst
 * @returns Array of bursts
 */
export function getBursts(
	edits: EditEvent[],
	gapThreshold = 2000,
): EditEvent[][] {
	const bursts: EditEvent[][] = [];
	let current: EditEvent[] = [];

	for (const edit of edits) {
		if (
			current.length > 0 &&
			edit.timestamp - current[current.length - 1]!.timestamp > gapThreshold
		) {
			bursts.push(current);
			current = [];
		}
		current.push(edit);
	}
	if (current.length > 0) bursts.push(current);
	return bursts;
}

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

/**
 * Calculates your overall WPM across the session
 * @param bursts Array of bursts
 * @returns Average WPM across all the bursts, disregarding very short ones
 */
export function weightedSessionWPM(bursts: EditEvent[][]): number {
	let totalWeightedWPM = 0;
	let totalDuration = 0;

	for (const burst of bursts) {
		const duration = burst[burst.length - 1]!.timestamp - burst[0]!.timestamp;
		if (duration < 500) continue; // skip single-event or near-instant bursts
		const wpm = burstWPM(burst);
		totalWeightedWPM += wpm * duration;
		totalDuration += duration;
	}

	return totalDuration === 0 ? 0 : totalWeightedWPM / totalDuration;
}

export function isBackwardJump(prev: EditEvent, curr: EditEvent): boolean {
	return curr.deletedFrom < prev.insertedTo;
}

export function emptyDailyStats(date: string): DailyStats {
	return {
		date,
		totalActiveMs: 0,
		totalNetChars: 0,
		totalGrossChars: 0,
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

	let netChars = 0;
	let grossChars = 0;
	let deletedChars = 0;
	let errorEvents = 0;

	for (let i = 0; i < burst.length; i++) {
		const e = burst[i]!;
		netChars += e.insertedText.length - e.deletedText.length;
		grossChars += e.insertedText.length + e.deletedText.length;
		deletedChars += e.deletedText.length;
		if (i > 0 && isBackwardJump(burst[i - 1]!, e)) errorEvents++;
	}

	// Weighted-average WPM (running average)
	stats.avgWPM =
		stats.totalActiveMs + duration === 0
			? 0
			: (stats.avgWPM * stats.totalActiveMs + wpm * duration) /
				(stats.totalActiveMs + duration);

	stats.totalActiveMs += duration;
	stats.totalNetChars += netChars;
	stats.totalGrossChars += grossChars;
	stats.totalDeletedChars += deletedChars;
	stats.burstCount += 1;
	stats.errorEvents += errorEvents;
}
