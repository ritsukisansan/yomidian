import type { DictionaryEntry } from './types';
import { DictionaryDatabase } from './database';

export interface DictionaryMatch {
	dictionary: string;
	entry: DictionaryEntry;
}

export class DictionaryEngine {
	constructor(private readonly database: DictionaryDatabase) {}

	async find(text: string, limit = 20): Promise<DictionaryMatch[]> {
		const matches = await this.database.find(text, limit);
		return matches.map(({ dictionary, ...entry }) => ({ dictionary, entry }));
	}
}
