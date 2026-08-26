import type { App } from 'obsidian';
import type { Dictionary, DictionaryStoreData } from './types';

const EMPTY_DATA: DictionaryStoreData = { dictionaries: [] };

export class DictionaryStore {
	private data: DictionaryStoreData = { ...EMPTY_DATA };

	constructor(private readonly app: App) {}

	async load(): Promise<void> {
		const stored = (await this.app.loadLocalStorage?.('yomidian-dictionaries')) as
			| DictionaryStoreData
			| null
			| undefined;
		this.data = stored?.dictionaries ? stored : { dictionaries: [] };
	}

	async save(): Promise<void> {
		await this.app.saveLocalStorage?.('yomidian-dictionaries', this.data);
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
