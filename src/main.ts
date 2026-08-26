import { MarkdownView, Notice, Plugin } from 'obsidian';
import { DictionaryEngine } from './core/dictionary-engine';
import { DictionaryStore } from './core/dictionary-store';
import { importYomitanDictionary } from './core/dictionary-importer';
import { LookupModal } from './ui/lookup-modal';
import { YomidianSettingTab } from './settings';
import type { Dictionary } from './core/types';

export default class Yomidian extends Plugin {
	private readonly store = new DictionaryStore(this);
	private readonly engine = new DictionaryEngine();

	async onload(): Promise<void> {
		await this.store.load();
		this.engine.setDictionaries(this.store.dictionaries);

		this.addCommand({
			id: 'lookup-selection',
			name: 'Look up selected Japanese text',
			checkCallback: (checking) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				const selected = editor?.getSelection().trim();
				if (!selected) return false;
				if (!checking) this.lookup(selected);
				return true;
			},
		});

		this.addCommand({
			id: 'import-yomitan-dictionary',
			name: 'Import Yomitan dictionary',
			callback: () => this.importDictionary(),
		});

		this.addRibbonIcon('book-open', 'Yomidian dictionary', () => {
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			const selected = editor?.getSelection().trim();
			if (selected) this.lookup(selected);
			else new Notice('Select Japanese text first.');
		});

		this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
			if (event.key !== 'Shift' || event.repeat) return;
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			const selected = editor?.getSelection().trim();
			if (selected) this.lookup(selected);
		});

		this.addSettingTab(new YomidianSettingTab(this.app, this));
	}

	getDictionaries(): readonly Dictionary[] {
		return this.store.dictionaries;
	}

	async removeDictionary(name: string): Promise<void> {
		await this.store.remove(name);
		this.engine.setDictionaries(this.store.dictionaries);
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
				await this.store.replace(dictionary);
				this.engine.setDictionaries(this.store.dictionaries);
				new Notice(`Imported ${dictionary.name} (${dictionary.entries.length.toLocaleString()} entries).`);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				new Notice(`Yomidian import failed: ${message}`);
			}
		});
		input.click();
	}

	private lookup(query: string): void {
		const matches = this.engine.find(query);
		new LookupModal(this.app, query, matches).open();
	}
}
