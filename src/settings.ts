import { App, PluginSettingTab, Setting } from 'obsidian';
import TypingStats from './main';

export interface TypingStatsSettings {
	enabled: boolean;
	// Minimum time gap in MS between changes to consider the next change part of a new burst
	newBurstThreshold: number;
}

export const DEFAULT_SETTINGS: TypingStatsSettings = {
	enabled: true,
	newBurstThreshold: 2000,
};

const MIN_BURST_THRESHOLD = 500;

export class TypingStatsSettingTab extends PluginSettingTab {
	plugin: TypingStats;

	constructor(app: App, plugin: TypingStats) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Enabled')
			.setDesc(
				'Whether typing analysis is on (you can still browse previous stats if off)',
			)
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.enabled);
				cb.onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('New burst threshold (ms)')
			.setDesc('How much inactive time until a new typing "burst" is started')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = '500';

				text.setValue(String(this.plugin.settings.newBurstThreshold));

				text.onChange(async (value) => {
					if (Number(value) < MIN_BURST_THRESHOLD) {
						return;
					}
					this.plugin.settings.newBurstThreshold = Number(value);
					await this.plugin.saveSettings();
				});
			});
	}
}
