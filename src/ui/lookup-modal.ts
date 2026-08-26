import { App, Modal } from 'obsidian';
import type { DictionaryMatch } from '../core/dictionary-engine';

export class LookupModal extends Modal {
	constructor(
		app: App,
		private readonly query: string,
		private readonly matches: readonly DictionaryMatch[],
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('yomidian-lookup');
		contentEl.createEl('h2', { text: this.query });

		if (this.matches.length === 0) {
			contentEl.createEl('p', { text: 'No dictionary entries found.' });
			return;
		}

		for (const match of this.matches) {
			const section = contentEl.createDiv({ cls: 'yomidian-entry' });
			const heading = section.createDiv({ cls: 'yomidian-entry-heading' });
			heading.createEl('strong', { text: match.entry.term });
			if (match.entry.reading) {
				heading.createSpan({ text: `  ${match.entry.reading}` });
			}
			heading.createSpan({ text: `  [${match.dictionary}]` });

			const list = section.createEl('ol');
			for (const gloss of match.entry.glosses) {
				list.createEl('li', { text: gloss });
			}
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
