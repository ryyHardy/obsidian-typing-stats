import { App, PluginSettingTab, Setting } from 'obsidian';
import TypingStats from './main';

export interface TypingStatsSettings {
	enabled: boolean;
	// Minimum time gap in MS between changes to consider the next change part of a new burst
	newBurstThreshold: number;
	minBurstDuration: number;
}

export const DEFAULT_SETTINGS: TypingStatsSettings = {
	enabled: true,
	newBurstThreshold: 2000,
	minBurstDuration: 500,
};

const MIN_BURST_THRESHOLD = 500;
const MIN_MIN_BURST_DURATION = 0; // nice name lol

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
			.setName('Minimum burst duration (ms)')
			.setDesc(
				'Any typing burst shorter than this duration is not counted in your stats',
			)
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = String(MIN_MIN_BURST_DURATION);

				text.setValue(String(this.plugin.settings.minBurstDuration));

				text.onChange(async (value) => {
					const num = Number(value);
					if (Number.isNaN(num) || num < MIN_MIN_BURST_DURATION) {
						text.setValue(String(this.plugin.settings.minBurstDuration));
						return;
					}
					this.plugin.settings.minBurstDuration = Number(value);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('New burst threshold (ms)')
			.setDesc(
				'How much inactive time after typing until a new typing burst is started',
			)
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = String(MIN_BURST_THRESHOLD);

				text.setValue(String(this.plugin.settings.newBurstThreshold));

				text.onChange(async (value) => {
					const num = Number(value);
					if (Number.isNaN(num) || num < MIN_BURST_THRESHOLD) {
						text.setValue(String(this.plugin.settings.newBurstThreshold));
						return;
					}
					this.plugin.settings.newBurstThreshold = num;
					await this.plugin.saveSettings();
				});
			});
	}
}
