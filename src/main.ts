import { MarkdownView, Notice, Plugin } from 'obsidian';
import { DictionaryDatabase } from './core/database';
import { DictionaryEngine } from './core/dictionary-engine';
import { importYomitanDictionary } from './core/dictionary-importer';
import { LookupModal } from './ui/lookup-modal';
import { YomidianSettingTab } from './settings';
import type { DictionarySummary } from './core/types';

export default class Yomidian extends Plugin {
	private readonly database = new DictionaryDatabase();
	private readonly engine = new DictionaryEngine(this.database);

	async onload(): Promise<void> {
		this.addCommand({
			id: 'lookup-selection',
			name: 'Look up selected Japanese text',
			checkCallback: (checking) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				const selected = editor?.getSelection().trim();
				if (!selected) return false;
				if (!checking) void this.lookup(selected);
				return true;
			},
		});

		this.addCommand({
			id: 'import-yomitan-dictionary',
			name: 'Import Yomitan dictionary',
			callback: () => void this.importDictionary(),
		});

		this.addRibbonIcon('book-open', 'Yomidian dictionary', () => {
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			const selected = editor?.getSelection().trim();
			if (selected) void this.lookup(selected);
			else new Notice('Select Japanese text first.');
		});

		this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
			if (event.key !== 'Shift' || event.repeat) return;
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			const selected = editor?.getSelection().trim();
			if (selected) void this.lookup(selected);
		});

		this.addSettingTab(new YomidianSettingTab(this.app, this));
	}

	onunload(): void {
		void this.database.close();
	}

	async getDictionaries(): Promise<DictionarySummary[]> {
		return this.database.list();
	}

	async removeDictionary(name: string): Promise<void> {
		await this.database.remove(name);
	}

	async importDictionary(): Promise<void> {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.zip,application/zip';
		input.addEventListener('change', async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				new Notice(`Importing ${file.name}…`);
				const dictionary = await importYomitanDictionary(file);
				await this.database.import(dictionary);
				new Notice(`Imported ${dictionary.name} (${dictionary.entries.length.toLocaleString()} entries).`);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				new Notice(`Yomidian import failed: ${message}`);
			}
		});
		input.click();
	}

	private async lookup(query: string): Promise<void> {
		const matches = await this.engine.find(query);
		new LookupModal(this.app, query, matches).open();
	}
}
