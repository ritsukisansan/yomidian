import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';
import type { Dictionary, DictionaryEntry } from './types';

interface DictionaryIndex {
	title?: string;
	dictionaryFormat?: number;
	version?: number;
	revision?: string;
}

const decode = (value: unknown): string => {
	if (typeof value === 'string') return value.replace(/<[^>]+>/g, '').trim();
	if (Array.isArray(value)) return value.map(decode).filter(Boolean).join(' ');
	return '';
};

const parseTermBank = (text: string): DictionaryEntry[] => {
	const entries: DictionaryEntry[] = [];
	for (const line of text.split(/\r?\n/)) {
		if (!line.trim()) continue;
		let row: unknown;
		try {
			row = JSON.parse(line);
		} catch {
			continue;
		}
		if (!Array.isArray(row) || row.length < 6) continue;
		const [term, reading, definitionTags, rules, , definitions, sequence] = row;
		if (typeof term !== 'string' || !Array.isArray(definitions)) continue;
		entries.push({
			term,
			reading: typeof reading === 'string' ? reading : '',
			definitionTags: typeof definitionTags === 'string' && definitionTags
				? definitionTags.split(' ')
				: [],
			rules: typeof rules === 'string' && rules ? rules.split(' ') : [],
			glosses: definitions
				.map((definition) => {
					if (typeof definition === 'string' || Array.isArray(definition)) return decode(definition);
					if (definition && typeof definition === 'object' && 'glossary' in definition) {
						return decode((definition as { glossary?: unknown }).glossary);
					}
					return JSON.stringify(definition);
				})
				.filter(Boolean),
			sequence: typeof sequence === 'number' ? sequence : undefined,
		});
	}
	return entries;
};

export async function importYomitanDictionary(file: File): Promise<Dictionary> {
	const reader = new ZipReader(new BlobReader(file));
	try {
		const entries = await reader.getEntries();
		const files = new Map<string, typeof entries[number]>();
		for (const entry of entries) {
			if (!entry.directory) files.set(entry.filename, entry);
		}

		const indexEntry = files.get('index.json');
		if (!indexEntry) throw new Error('Not a Yomitan dictionary: index.json is missing.');
		const index = JSON.parse(await indexEntry.getData!(new TextWriter())) as DictionaryIndex;
		if (index.dictionaryFormat !== undefined && index.dictionaryFormat < 3) {
			throw new Error(`Unsupported Yomitan dictionary format: ${index.dictionaryFormat}`);
		}

		const termEntries: DictionaryEntry[] = [];
		for (const [filename, entry] of files) {
			if (!/^term_bank_\d+\.json$/.test(filename)) continue;
			termEntries.push(...parseTermBank(await entry.getData!(new TextWriter())));
		}
		if (termEntries.length === 0) throw new Error('No term banks were found in the dictionary.');

		return {
			name: index.title?.trim() || file.name.replace(/\.zip$/i, ''),
			version: String(index.version ?? index.dictionaryFormat ?? 3),
			revision: index.revision ?? '',
			entries: termEntries,
		};
	} finally {
		await reader.close();
	}
}
