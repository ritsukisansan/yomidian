import type { DictionaryEntry } from './types';
import { DictionaryDatabase } from './database';
import { deinflect } from './deinflector';

export interface DictionaryMatch {
	dictionary: string;
	entry: DictionaryEntry;
	matchedTerm: string;
	reasons: string[];
}

export class DictionaryEngine {
	constructor(private readonly database: DictionaryDatabase) {}

	async find(text: string, limit = 20): Promise<DictionaryMatch[]> {
		const query = text.trim();
		if (!query) return [];

		const candidates = deinflect(query);
		const results: DictionaryMatch[] = [];
		const seen = new Set<string>();

		for (const candidate of candidates) {
			const matches = await this.database.find(candidate.term, limit - results.length);
			for (const match of matches) {
				const key = `${match.dictionary}\u0000${match.term}\u0000${match.reading}\u0000${match.sequence ?? ''}`;
				if (seen.has(key)) continue;
				seen.add(key);
				results.push({
					dictionary: match.dictionary,
					entry: {
						term: match.term,
						reading: match.reading,
						glosses: match.glosses,
						definitionTags: match.definitionTags,
						sequence: match.sequence,
					},
					matchedTerm: candidate.term,
					reasons: candidate.reasons,
				});
				if (results.length >= limit) return results;
			}
		}
		return results;
	}
}
