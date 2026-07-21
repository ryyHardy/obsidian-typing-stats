import {
  App,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem,
} from 'obsidian';
import TypingStats from './main';

export interface TypingStatsSettings {
  enabled: boolean;
  // Minimum time gap in MS between changes to consider the next change part of a new burst
  newBurstThreshold: number;
  // Minimum duration for a burst to be counted
  minBurstDuration: number;
}

// Defaults

export const DEFAULT_SETTINGS: TypingStatsSettings = {
  enabled: true,
  newBurstThreshold: 2000,
  minBurstDuration: 500,
};

// Constraints

const MIN_BURST_THRESHOLD = 500;
const MIN_MIN_BURST_DURATION = 0; // nice name lol

// UI Helpers

function validateNumber(value: string, min?: number, max?: number): string {
  if (value.trim() === '') {
    return 'Please enter a number';
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 'Please enter a valid number';
  }

  if (min != null && num < min) {
    return `Value must be at least ${min}`;
  }

  if (max != null && num > max) {
    return `Value must be at most ${max}`;
  }

  return '';
}

function constrainedNumberSetting(
  containerEl: HTMLElement,
  name: string,
  helpText: string,
  initialValue: number,
  onValid: (value: number) => Promise<void> | void,
  min?: number,
  max?: number,
) {
  const setting = new Setting(containerEl).setName(name).setDesc(helpText);

  setting.addText((text) => {
    text.inputEl.type = 'number';
    if (min != null) text.inputEl.min = String(min);
    if (max != null) text.inputEl.max = String(max);
    text.setValue(String(initialValue));

    text.onChange(async (value) => {
      const error = validateNumber(value, min, max);
      text.inputEl.classList.toggle('mod-error', !!error);
      text.inputEl.setAttribute('aria-invalid', String(!!error));

      if (error) {
        setting.setDesc(error);
        return;
      }

      setting.setDesc(helpText);
      await onValid(Number(value));
    });
  });
}

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

    constrainedNumberSetting(
      containerEl,
      'Minimum burst duration (ms)',
      'Any typing burst shorter than this duration is not counted in your stats',
      this.plugin.settings.minBurstDuration,
      async (value) => {
        this.plugin.settings.minBurstDuration = value;
        await this.plugin.saveSettings();
      },
      MIN_MIN_BURST_DURATION,
    );

    constrainedNumberSetting(
      containerEl,
      'New burst threshold (ms)',
      'How much inactive time after typing until a new typing burst is started',
      this.plugin.settings.newBurstThreshold,
      async (value) => {
        this.plugin.settings.newBurstThreshold = value;
        await this.plugin.saveSettings();
      },
      MIN_BURST_THRESHOLD,
    );
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Enabled',
        desc: 'Whether typing analysis is on (you can still browse previous stats if off)',
        control: { type: 'toggle', key: 'enabled', defaultValue: true },
      },
      {
        name: 'Minimum burst duration (ms)',
        desc: 'Any typing burst shorter than this duration is not counted in your stats',
        control: {
          type: 'number',
          key: 'minBurstDuration',
          validate: (value: number) =>
            value <= MIN_MIN_BURST_DURATION
              ? `Value must be at least ${MIN_MIN_BURST_DURATION}`
              : undefined,
        },
      },
      {
        name: 'New burst threshold (ms)',
        desc: 'How much inactive time after typing until a new typing burst is started',
        control: {
          type: 'number',
          key: 'newBurstThreshold',
          validate: (value: number) =>
            value <= MIN_BURST_THRESHOLD
              ? `Value must be at least ${MIN_BURST_THRESHOLD}`
              : undefined,
        },
      },
    ];
  }
}
