import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';

import TypingStats, { dayKeyFor } from './main';

export const VIEW_TYPE_KEY_STATS = 'typing-stats-view';

export class TypingStatsView extends ItemView {
	wpmEl: HTMLElement | null = null;
	plugin: TypingStats;

	constructor(leaf: WorkspaceLeaf, plugin: TypingStats) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_KEY_STATS;
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

		container.append(
			createFragment((root) => {
				root.createEl('h4', { text: 'Typing stats' });
				root.createEl('hr');
				root.createEl('h5', {
					text: `Today (${new Date().toLocaleDateString()})`,
				});
				root.createEl('ul', {}, (ul) => {
					ul.createEl('li', {
						text: `Average WPM: ${this.plugin.todayStats.avgWPM}`,
					});
					ul.createEl('li', {
						text: `# of Bursts: ${this.plugin.todayStats.burstCount}`,
					});
					ul.createEl('li', {
						text: `Errors: ${this.plugin.todayStats.errorEvents}`,
					});
					ul.createEl('li', {
						text: `Active Time (s): ${Math.round(this.plugin.todayStats.totalActiveMs / 1000)}`,
					});
					ul.createEl('li', {
						text: `Total Chars Added: ${this.plugin.todayStats.totalAddedChars}`,
					});
					ul.createEl('li', {
						text: `Total Chars Deleted: ${this.plugin.todayStats.totalDeletedChars}`,
					});
					ul.createEl('li', {
						text: `Net Chars (Added - Deleted): ${this.plugin.todayStats.totalAddedChars - this.plugin.todayStats.totalDeletedChars}`,
					});
				});
			}),
		);
	}

	async onClose() {
		// Add cleanup here if needed
	}
}
