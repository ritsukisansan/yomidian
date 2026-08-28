import type { DictionaryEntry } from './types';
import { DictionaryDatabase } from './database';
import { LanguageTransformer } from './language-transformer';
import { japaneseTransforms } from './japanese-transforms';

export interface DictionaryMatch {
	dictionary: string;
	entry: DictionaryEntry;
	matchedTerm: string;
	reasons: string[];
}

const transformer = new LanguageTransformer();
transformer.addDescriptor(japaneseTransforms);

function conditionMatchesEntry(condition: string | null, entry: DictionaryEntry): boolean {
	if (!condition || !entry.rules || entry.rules.length === 0) return true;
	return entry.rules.includes(condition) || entry.rules.includes('v');
}

export class DictionaryEngine {
	constructor(private readonly database: DictionaryDatabase) {}

	async find(text: string, limit = 20): Promise<DictionaryMatch[]> {
		const query = text.trim();
		if (!query) return [];

		const candidates = transformer.transform('ja', query, 64);
		const results: DictionaryMatch[] = [];
		const seen = new Set<string>();

		for (const candidate of candidates) {
			const matches = await this.database.find(candidate.term, limit - results.length);
			for (const match of matches) {
				if (!conditionMatchesEntry(candidate.condition, match)) continue;
				const key = `${match.dictionary}\u0000${match.term}\u0000${match.reading}\u0000${match.sequence ?? ''}`;
				if (seen.has(key)) continue;
				seen.add(key);
				results.push({
					dictionary: match.dictionary,
					entry: match,
					matchedTerm: candidate.term,
					reasons: candidate.reasons,
				});
				if (results.length >= limit) return results;
			}
		}
		return results;
	}
}
