import { Plugin } from 'obsidian';
import {
	KeyStatsSettings,
	DEFAULT_SETTINGS,
	KeyStatsSettingTab,
} from './settings';

import { EditorView } from '@codemirror/view';

export default class KeyStats extends Plugin {
	private statusBarItemEl!: HTMLElement;
	settings!: KeyStatsSettings;

	async onload() {
		await this.loadSettings();

		// Set up commands here if needed

		this.addSettingTab(new KeyStatsSettingTab(this.app, this));

		this.statusBarItemEl = this.addStatusBarItem().createEl('span', {
			text: 'Stats: Ready',
		});

		this.registerEditorExtension(
			EditorView.updateListener.of((update) => {
				if (!update.docChanged) return;

				let totalAdded = 0;
				let totalDeleted = 0;

				for (const tr of update.transactions) {
					if (!tr.docChanged) continue;

					tr.changes.iterChanges(
						(fromA, toA, fromB, toB, inserted) => {
							const deletedStr = tr.startState.doc.sliceString(
								fromA,
								toA,
							);
							const addedStr = inserted.toString();

							totalAdded += addedStr.length;
							totalDeleted += deletedStr.length;
						},
					);
				}

				if (totalAdded > 0 || totalDeleted > 0) {
					window.requestAnimationFrame(() => {
						this.statusBarItemEl.setText(
							`+${totalAdded} chrs | -${totalDeleted} chrs`,
						);
					});
				}
			}),
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<KeyStatsSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
