export interface DictionaryEntry {
	term: string;
	reading: string;
	glosses: string[];
	definitionTags?: string[];
	sequence?: number;
}

export interface Dictionary {
	name: string;
	version: string;
	revision: string;
	entries: DictionaryEntry[];
}

export interface DictionarySummary {
	name: string;
	version: string;
	revision: string;
	entryCount: number;
}

export interface DictionaryStoreData {
	dictionaries: Dictionary[];
}
