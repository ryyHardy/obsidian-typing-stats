import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import {
  TypingStatsSettings,
  DEFAULT_SETTINGS,
  TypingStatsSettingTab,
} from './settings';

import { removeEmptyDays, shouldIgnoreFile } from './lib/stats';

import { EditorView } from '@codemirror/view';
import { DailyStats, EditEvent, TypingStatsData } from './lib/types';
import {
  addBurstToDailyStats,
  shouldDiscardBurst,
  toDailyStats,
} from './lib/stats';

import { TypingStatsView, VIEW_TYPE_TYPING_STATS } from './view';
import { CURRENT_SCHEMA_VERSION, migratePluginData } from './lib/migrations';

const SAVE_DEBOUNCE_MS = 2000;

export function dayKeyFor(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converts old/incomplete versions of the settings schema into the most updated version
 * Used for updating  users' `data.json` files to a changed schema in a new version of the plugin
 * @param existing The old/incomplete settings that must be updated
 * @returns The updated settings
 */
function normalizedSettings(
  existing: Partial<TypingStatsSettings> | undefined,
): TypingStatsSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...existing,
    // ...add settings to be adjusted below, EX:
    // fileIgnorePatterns: Array.isArray(existing?.fileIgnorePatterns)
    //   ? existing.fileIgnorePatterns
    //   : [],
  };
}

export default class TypingStats extends Plugin {
  settings!: TypingStatsSettings;
  history: Record<string, DailyStats> = {};

  // A "burst" is a sequence of changes happening very close to each other
  currentBurst: EditEvent[] = [];
  private burstTimer: number | null = null;

  todayStats!: DailyStats;

  private saveTimer: number | null = null;

  async onload() {
    // Settings
    await this.loadPluginData();
    this.addSettingTab(new TypingStatsSettingTab(this.app, this));

    // Set up commands
    this.addCommand({
      id: 'toggle-typing-analysis',
      name: 'Toggle typing analysis',
      callback: () => {
        this.settings.enabled = !this.settings.enabled;
        new Notice(
          `Typing analysis turned ${this.settings.enabled ? 'ON' : 'OFF'}.`,
          5000,
        );
        void this.saveSettings();
      },
    });
    this.addCommand({
      id: 'open-typing-stat-view',
      name: 'Open typing stat viewer',
      callback: () => {
        void this.activateView();
      },
    });

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

        const filePath = this.app.workspace.getActiveFile()?.path ?? '';
        if (shouldIgnoreFile(filePath, this.settings.fileIgnorePatterns)) {
          return;
        }

        const now = Date.now();

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
              fileKey: filePath,
              deletedFrom: fromA,
              deletedTo: toA,
              deletedText,
              insertedFrom: fromB,
              insertedTo: toB,
              insertedText,
              selectionBefore,
              selectionAfter,
            });
            this.scheduleBurstTimeout();
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

  private closeBurst() {
    if (this.burstTimer !== null) {
      window.clearTimeout(this.burstTimer);
      this.burstTimer = null;
    }
    if (this.currentBurst.length === 0) return;

    if (shouldDiscardBurst(this.currentBurst, this.settings.minBurstDuration)) {
      this.currentBurst = [];
      return; // Don't count burst if it is non-instant and shorter than the user-specified minimum
    }

    const dayKey = dayKeyFor(
      this.currentBurst[this.currentBurst.length - 1]!.timestamp,
    );
    if (dayKey !== this.todayStats.date) {
      // Day boundary crossed during burst
      void this.flushSave();
      this.todayStats = toDailyStats(dayKey, this.history[dayKey]);
      this.history[dayKey] = this.todayStats;
    }

    addBurstToDailyStats(this.todayStats, this.currentBurst);
    this.currentBurst = [];
    this.queueSave();
    this.updateView(); // Update stats in the view for those who have it open
  }

  private scheduleBurstTimeout() {
    if (this.burstTimer !== null) window.clearTimeout(this.burstTimer);
    this.burstTimer = window.setTimeout(() => {
      this.burstTimer = null;
      this.closeBurst();
    }, this.settings.newBurstThreshold);
  }

  private updateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TYPING_STATS);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof TypingStatsView) {
        view.refresh();
      }
    }
  }

  private async loadPluginData() {
    const rawData = (await this.loadData()) as unknown;
    const migratedData = migratePluginData(rawData);

    this.settings = normalizedSettings(migratedData.settings);

    this.history = Object.fromEntries(
      Object.entries(migratedData.history).map(([dayKey, stats]) => [
        dayKey,
        toDailyStats(dayKey, stats),
      ]),
    );

    this.history = removeEmptyDays(this.history);

    const today = dayKeyFor(Date.now());
    this.todayStats = toDailyStats(today, this.history[today]);
    this.history[today] = this.todayStats;

    if (
      rawData == null ||
      (rawData as Partial<TypingStatsData>).schemaVersion !==
        CURRENT_SCHEMA_VERSION
    ) {
      await this.saveData({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        settings: this.settings,
        history: this.history,
      });
    }
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
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: this.settings,
      history: removeEmptyDays(this.history),
    };
    await this.saveData(data);
  }

  async saveSettings() {
    await this.flushSave();
  }
}
