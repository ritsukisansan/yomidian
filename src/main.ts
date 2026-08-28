import { MarkdownView, Notice, Plugin } from 'obsidian';
import { DictionaryDatabase } from './core/database';
import { DictionaryEngine } from './core/dictionary-engine';
import { importYomitanDictionary } from './core/dictionary-importer';
import { LookupModal } from './ui/lookup-modal';
import { YomidianSettingTab } from './settings';
import type { DictionarySummary } from './core/types';

const japaneseCharacter = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

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
			id: 'lookup-japanese-under-cursor',
			name: 'Look up Japanese text under cursor',
			callback: () => {
				const query = this.getJapaneseTextUnderCursor();
				if (query) void this.lookup(query);
				else new Notice('Place the cursor on Japanese text first.');
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
			const query = selected || this.getJapaneseTextUnderCursor();
			if (query) void this.lookup(query);
			else new Notice('Place the cursor on Japanese text or select Japanese text first.');
		});

		this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
			if (event.key !== 'Shift' || event.repeat) return;
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			const selected = editor?.getSelection().trim();
			const query = selected || this.getJapaneseTextUnderCursor();
			if (query) void this.lookup(query);
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

	private getJapaneseTextUnderCursor(): string | null {
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) return null;
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		if (!line) return null;

		let offset = cursor.ch;
		if (offset >= line.length) offset = line.length - 1;
		if (offset < 0 || !japaneseCharacter.test(line[offset] ?? '')) return null;

		let start = offset;
		let end = offset + 1;
		while (start > 0 && japaneseCharacter.test(line[start - 1] ?? '')) start--;
		while (end < line.length && japaneseCharacter.test(line[end] ?? '')) end++;
		return line.slice(start, end).trim() || null;
	}

	private async lookup(query: string): Promise<void> {
		const matches = await this.engine.find(query);
		new LookupModal(this.app, query, matches).open();
	}
}
