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
			.setName('New burst threshold (ms)')
			.setDesc('How much inactive time until a new typing "burst" is started')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = '1';

				text.setValue(String(this.plugin.settings.newBurstThreshold));

				text.onChange(async (value) => {
					if (value === '') {
						// If the user empties the box, set it back to the previous value and stop
						text.setValue(String(this.plugin.settings.newBurstThreshold));
						return;
					}
					const numValue = Number(value);
					this.plugin.settings.newBurstThreshold = numValue;
					await this.plugin.saveSettings();
				});
			});
	}
}
