import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';

import TypingStats, { dayKeyFor } from './main';

export const VIEW_TYPE_TYPING_STATS = 'typing-stats-view';

export class TypingStatsView extends ItemView {
	wpmEl: HTMLElement | null = null;
	plugin: TypingStats;

	constructor(leaf: WorkspaceLeaf, plugin: TypingStats) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_TYPING_STATS;
	}

	getDisplayText() {
		return 'Typing stats';
	}

	getIcon(): IconName {
		return 'keyboard';
	}

	async onOpen() {
		this.renderViewContent();
	}

	private renderViewContent() {
		const container = this.contentEl;
		container.empty();

		const todayKey = dayKeyFor(Number(new Date()));

		container.append(
			createFragment((root) => {
				root.createEl('h4', { text: 'Typing stats' });
				const selectEl = root.createEl('select', {}, (sel) => {
					const days = Object.keys(this.plugin.history).sort((a, b) =>
						b.localeCompare(a),
					);
					for (const day of days) {
						const optionEl = sel.createEl('option', { value: day, text: day });

						// If the day key matches today's date, make it the default option
						if (day === todayKey) {
							optionEl.selected = true;
							optionEl.textContent = `${day} (today)`;
						}
					}
				});
				const statsContainer = root.createDiv('typing-stats-container');

				this.renderDayStats(statsContainer, todayKey);

				this.registerDomEvent(selectEl, 'change', (event: Event) => {
					const target = event.target as HTMLSelectElement;
					this.renderDayStats(statsContainer, target.value);
				});
			}),
		);
	}

	private renderDayStats(container: HTMLElement, dayKey: string) {
		container.empty(); // clear the inside first
		const stats = this.plugin.history[dayKey];
		if (!stats) {
			return;
		}

		const activeSeconds = stats.totalActiveMs / 1000;

		// TODO: Think of some other aggregate stats that might be useful

		container.createEl('h5', { text: `Stats for ${dayKey}` });

		container.createEl('ul', {}, (ul) => {
			ul.createEl('li', {
				text: `Active Time (s): ${Math.round(activeSeconds)}`,
			});
			ul.createEl('li', { text: `Average WPM: ${stats.avgWPM}` });
			ul.createEl('li', { text: `# of Bursts: ${stats.burstCount}` });
			ul.createEl('li', { text: `Error Events: ${stats.errorEvents}` });
			ul.createEl('li', {
				text: `Errors per second: ${activeSeconds !== 0 ? (stats.errorEvents / activeSeconds).toFixed(1) : 0}`,
			});
			ul.createEl('li', {
				text: `Total Chars Added: ${stats.totalAddedChars}`,
			});
			ul.createEl('li', {
				text: `Total Chars Deleted: ${stats.totalDeletedChars}`,
			});
			ul.createEl('li', {
				text: `Net Chars (Added - Deleted): ${stats.totalAddedChars - stats.totalDeletedChars}`,
			});
		});
	}

	async onClose() {
		// Add cleanup here if needed
	}
}
