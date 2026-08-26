import Dexie, { type EntityTable } from 'dexie';
import type { Dictionary, DictionaryEntry, DictionarySummary } from './types';

interface StoredDictionary {
	id?: number;
	name: string;
	version: string;
	revision: string;
	entryCount: number;
}

interface StoredEntry extends DictionaryEntry {
	id?: number;
	dictionaryId: number;
}

class YomidianDatabase extends Dexie {
	dictionaries!: EntityTable<StoredDictionary, 'id'>;
	entries!: EntityTable<StoredEntry, 'id'>;

	constructor() {
		super('yomidian');
		this.version(1).stores({
			dictionaries: '++id, &name',
			entries: '++id, dictionaryId, term, reading, [dictionaryId+term], [dictionaryId+reading]',
		});
	}
}

export class DictionaryDatabase {
	private readonly db = new YomidianDatabase();

	async list(): Promise<DictionarySummary[]> {
		return this.db.dictionaries.toArray();
	}

	async import(dictionary: Dictionary): Promise<void> {
		await this.db.transaction('rw', this.db.dictionaries, this.db.entries, async () => {
			const existing = await this.db.dictionaries.where('name').equals(dictionary.name).first();
			if (existing?.id !== undefined) {
				await this.db.entries.where('dictionaryId').equals(existing.id).delete();
				await this.db.dictionaries.delete(existing.id);
			}

			const dictionaryId = await this.db.dictionaries.add({
				name: dictionary.name,
				version: dictionary.version,
				revision: dictionary.revision,
				entryCount: dictionary.entries.length,
			});

			const rows = dictionary.entries.map((entry) => ({
				...entry,
				dictionaryId,
			}));
			for (let offset = 0; offset < rows.length; offset += 1000) {
				await this.db.entries.bulkAdd(rows.slice(offset, offset + 1000));
			}
		});
	}

	async remove(name: string): Promise<void> {
		await this.db.transaction('rw', this.db.dictionaries, this.db.entries, async () => {
			const dictionary = await this.db.dictionaries.where('name').equals(name).first();
			if (dictionary?.id === undefined) return;
			await this.db.entries.where('dictionaryId').equals(dictionary.id).delete();
			await this.db.dictionaries.delete(dictionary.id);
		});
	}

	async find(text: string, limit = 20): Promise<Array<DictionaryEntry & { dictionary: string }>> {
		const query = text.trim();
		if (!query) return [];
		const dictionaries = await this.db.dictionaries.toArray();
		const results: Array<DictionaryEntry & { dictionary: string }> = [];

		for (const dictionary of dictionaries) {
			if (dictionary.id === undefined) continue;
			const [terms, readings] = await Promise.all([
				this.db.entries.where('[dictionaryId+term]').equals([dictionary.id, query]).toArray(),
				this.db.entries.where('[dictionaryId+reading]').equals([dictionary.id, query]).toArray(),
			]);
			const seen = new Set<number>();
			for (const entry of [...terms, ...readings]) {
				if (entry.id !== undefined && seen.has(entry.id)) continue;
				if (entry.id !== undefined) seen.add(entry.id);
				const { id: _id, dictionaryId: _dictionaryId, ...value } = entry;
				void _id;
				void _dictionaryId;
				results.push({ ...value, dictionary: dictionary.name });
				if (results.length >= limit) return results;
			}
		}
		return results;
	}

	async close(): Promise<void> {
		this.db.close();
	}
}
