import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';

import TypingStats, { dayKeyFor } from './main';

export const VIEW_TYPE_TYPING_STATS = 'typing-stats-view';

export class TypingStatsView extends ItemView {
  plugin: TypingStats;

  private statsContainer!: HTMLElement;
  private selectedDayKey!: string;

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

    const todayKey = dayKeyFor(Date.now());
    this.selectedDayKey = todayKey;

    container.append(
      createFragment((root) => {
        root.createEl('h4', { text: 'Typing stats' });
        if (Object.keys(this.plugin.history).length === 0) {
          root.createEl('strong', {
            text: 'No stats yet. Start typing in a note to generate!',
          });
          return;
        }
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
        this.statsContainer = root.createDiv('typing-stats-container');

        this.renderDayStats(this.statsContainer, todayKey);

        this.registerDomEvent(selectEl, 'change', (event: Event) => {
          const target = event.target as HTMLSelectElement;
          this.selectedDayKey = target.value;
          this.renderDayStats(this.statsContainer, target.value);
        });
      }),
    );
  }

  private renderDayStats(container: HTMLElement, dayKey: string) {
    container.empty(); // clear the inside first
    const stats = this.plugin.history[dayKey];
    if (!stats) {
      container.createEl('strong', {
        text: 'No stats yet for today. Start typing in a note to generate!',
      });
      return;
    }

    // TODO: Think of some other aggregate stats that might be useful

    container.createEl('h5', { text: `Stats for ${dayKey}` });

    container.createEl('ul', {}, (ul) => {
      ul.createEl('li', {
        text: `Active Time (s): ${Math.round(stats.activeSeconds)}`,
      });
      ul.createEl('li', { text: `Average WPM: ${stats.avgWPM}` });
      ul.createEl('li', { text: `Bursts: ${stats.bursts}` });
      ul.createEl('li', { text: `Corrections: ${stats.corrections}` });
      ul.createEl('li', {
        text: `Errors per second: ${stats.activeSeconds !== 0 ? (stats.corrections / stats.activeSeconds).toFixed(1) : 0}`,
      });
      ul.createEl('li', {
        text: `Total Chars Added: ${stats.addedChars}`,
      });
      ul.createEl('li', {
        text: `Total Chars Deleted: ${stats.deletedChars}`,
      });
      ul.createEl('li', {
        text: `Net Chars (Added - Deleted): ${stats.addedChars - stats.deletedChars}`,
      });
    });
  }

  refresh() {
    if (!this.statsContainer) {
      this.renderViewContent();
      return;
    }
    this.renderDayStats(this.statsContainer, this.selectedDayKey);
  }

  async onClose() {
    // Add cleanup here if needed
  }
}
