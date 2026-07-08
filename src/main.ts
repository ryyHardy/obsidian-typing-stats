import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	TypingStatsSettings,
	DEFAULT_SETTINGS,
	TypingStatsSettingTab,
} from './settings';

import { EditorView } from '@codemirror/view';
import { DailyStats, EditEvent, TypingStatsData } from './types';
import { emptyDailyStats, addBurstToDailyStats } from './stats';

import { TypingStatsView, VIEW_TYPE_TYPING_STATS } from './view';

const SAVE_DEBOUNCE_MS = 2000;

export function dayKeyFor(ts: number): string {
	const d = new Date(ts);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default class TypingStats extends Plugin {
	settings!: TypingStatsSettings;
	history: Record<string, DailyStats> = {};

	// A "burst" is a sequence of changes happening very close to each other
	currentBurst: EditEvent[] = [];
	todayStats!: DailyStats;

	private saveTimer: number | null = null;

	async onload() {
		// Settings
		await this.loadPluginData();
		this.addSettingTab(new TypingStatsSettingTab(this.app, this));

		// Set up commands here if needed

		// Typing stats view
		this.registerView(
			VIEW_TYPE_TYPING_STATS,
			(leaf) => new TypingStatsView(leaf, this),
		);
		this.addRibbonIcon('keyboard', 'Typing stats', async () => {
			await this.activateView();
		});

		// Listen for document changes to update stats
		this.registerEditorExtension(
			EditorView.updateListener.of((update) => {
				if (!update.docChanged || !this.settings.enabled) return;

				const now = Date.now();
				const fileKey = this.app.workspace.getActiveFile()?.path ?? '';

				for (const tr of update.transactions) {
					if (!tr.docChanged) continue;

					const selectionBefore = {
						anchor: tr.startState.selection.main.anchor,
						head: tr.startState.selection.main.head,
					};
					const selectionAfter = {
						anchor: tr.newSelection.main.anchor,
						head: tr.newSelection.main.head,
					};

					tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
						const deletedText = tr.startState.doc.sliceString(fromA, toA);
						const insertedText = inserted.toString();
						const lastTs =
							this.currentBurst[this.currentBurst.length - 1]?.timestamp;

						if (
							lastTs !== undefined &&
							now - lastTs > this.settings.newBurstThreshold
						) {
							this.closeBurst();
						}
						// Continue current burst
						this.currentBurst.push({
							timestamp: now,
							fileKey,
							deletedFrom: fromA,
							deletedTo: toA,
							deletedText,
							insertedFrom: fromB,
							insertedTo: toB,
							insertedText,
							selectionBefore,
							selectionAfter,
						});
					});
				}
			}),
		);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TYPING_STATS);

		if (leaves.length > 0 && leaves[0] != null) {
			leaf = leaves[0];
			await workspace.revealLeaf(leaf);
		} else {
			leaf = workspace.getRightLeaf(false)!;
			await leaf.setViewState({
				type: VIEW_TYPE_TYPING_STATS,
				active: true,
			});

			await workspace.revealLeaf(leaf);
		}
	}

	onunload() {
		this.closeBurst();
		void this.flushSave();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<TypingStatsSettings>,
		);
	}

	private closeBurst() {
		if (this.currentBurst.length === 0) return;
		const dayKey = dayKeyFor(
			this.currentBurst[this.currentBurst.length - 1]!.timestamp,
		);
		if (dayKey !== this.todayStats.date) {
			// Day boundary crossed during burst
			void this.flushSave();
			this.todayStats = this.history[dayKey] ??= emptyDailyStats(dayKey);
		}

		addBurstToDailyStats(this.todayStats, this.currentBurst);
		this.currentBurst = [];
		this.queueSave();
	}

	private async loadPluginData() {
		const data = (await this.loadData()) as Partial<TypingStatsData> | null;

		this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
		this.history = data?.history ?? {};

		const today = dayKeyFor(Date.now());
		this.todayStats = this.history[today] ?? emptyDailyStats(today);
		this.history[today] = this.todayStats;
	}

	private queueSave() {
		if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
		this.saveTimer = window.setTimeout(
			() => void this.flushSave(),
			SAVE_DEBOUNCE_MS,
		);
	}

	private async flushSave() {
		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}
		const data: TypingStatsData = {
			settings: this.settings,
			history: this.history,
		};
		await this.saveData(data);
	}

	async saveSettings() {
		await this.flushSave();
	}
}
