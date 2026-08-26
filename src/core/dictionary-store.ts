import type { Dictionary, DictionaryStoreData } from './types';

export interface DictionaryPersistence {
	loadData(): Promise<unknown>;
	saveData(data: unknown): Promise<void>;
}

export class DictionaryStore {
	private data: DictionaryStoreData = { dictionaries: [] };

	constructor(private readonly persistence: DictionaryPersistence) {}

	async load(): Promise<void> {
		const stored = (await this.persistence.loadData()) as
			| DictionaryStoreData
			| null
			| undefined;
		this.data = stored?.dictionaries ? stored : { dictionaries: [] };
	}

	async save(): Promise<void> {
		await this.persistence.saveData(this.data);
	}

	get dictionaries(): readonly Dictionary[] {
		return this.data.dictionaries;
	}

	async replace(dictionary: Dictionary): Promise<void> {
		const index = this.data.dictionaries.findIndex(
			(item) => item.name === dictionary.name,
		);
		if (index >= 0) {
			this.data.dictionaries[index] = dictionary;
		} else {
			this.data.dictionaries.push(dictionary);
		}
		await this.save();
	}

	async remove(name: string): Promise<void> {
		this.data.dictionaries = this.data.dictionaries.filter(
			(dictionary) => dictionary.name !== name,
		);
		await this.save();
	}
}
