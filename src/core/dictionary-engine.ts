import type { Dictionary, DictionaryEntry } from './types';

export interface DictionaryMatch {
	dictionary: string;
	entry: DictionaryEntry;
}

export class DictionaryEngine {
	private readonly dictionaries: Dictionary[] = [];

	setDictionaries(dictionaries: readonly Dictionary[]): void {
		this.dictionaries.length = 0;
		this.dictionaries.push(...dictionaries);
	}

	find(text: string, limit = 20): DictionaryMatch[] {
		const query = text.trim();
		if (!query) return [];
		const matches: DictionaryMatch[] = [];
		for (const dictionary of this.dictionaries) {
			for (const entry of dictionary.entries) {
				if (entry.term === query || entry.reading === query) {
					matches.push({ dictionary: dictionary.name, entry });
					if (matches.length >= limit) return matches;
				}
			}
		}
		return matches;
	}
}
