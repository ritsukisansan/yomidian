import { App, PluginSettingTab, Setting } from 'obsidian';
import Yomidian from './main';

export interface YomidianSettings {}

export const DEFAULT_SETTINGS: YomidianSettings = {};

export class YomidianSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: Yomidian) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Yomidian' });
		containerEl.createEl('p', {
			text: 'Native Japanese dictionary lookup using the Yomitan dictionary format. Yomidian does not require Yomitan or a browser extension.',
		});

		new Setting(containerEl)
			.setName('Import dictionary')
			.setDesc('Import a Yomitan dictionary ZIP file directly into this Obsidian vault.')
			.addButton((button) =>
				button.setButtonText('Import ZIP').onClick(() => this.plugin.importDictionary()),
			);

		const dictionaries = this.plugin.getDictionaries();
		containerEl.createEl('h3', { text: 'Installed dictionaries' });
		if (dictionaries.length === 0) {
			containerEl.createEl('p', { text: 'No dictionaries installed.' });
			return;
		}
		for (const dictionary of dictionaries) {
			new Setting(containerEl)
				.setName(dictionary.name)
				.setDesc(`${dictionary.entries.length.toLocaleString()} entries · revision ${dictionary.revision || 'unknown'}`)
				.addButton((button) =>
					button.setButtonText('Remove').setWarning().onClick(async () => {
						await this.plugin.removeDictionary(dictionary.name);
						this.display();
					}),
				);
		}
	}
}
