import { LanguageTransformer } from './language-transformer';
import { japaneseTransforms } from './japanese-transforms';

export interface DeinflectionResult {
	term: string;
	reasons: string[];
}

const transformer = new LanguageTransformer();
transformer.addDescriptor(japaneseTransforms);

export function deinflect(text: string, maxResults = 64): DeinflectionResult[] {
	return transformer
		.transform('ja', text, maxResults)
		.map(({ term, reasons }) => ({ term, reasons }));
}
