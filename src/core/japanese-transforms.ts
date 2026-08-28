import {
	regexInflection,
	suffixInflection,
	type LanguageTransformDescriptor,
} from './language-transformer';

const conditions = {
	v: { name: 'Verb', isDictionaryForm: true, subConditions: ['v1', 'v5', 'vk', 'vs'] },
	v1: { name: 'Ichidan verb', isDictionaryForm: true },
	v5: { name: 'Godan verb', isDictionaryForm: true },
	vk: { name: 'くる verb', isDictionaryForm: true },
	vs: { name: 'する verb', isDictionaryForm: true },
	te: { name: 'て-form', isDictionaryForm: false },
	neg: { name: 'Negative form', isDictionaryForm: false },
	masu: { name: 'Polite form', isDictionaryForm: false },
};

const godanDictionary: Record<string, string> = {
	う: 'う',
	い: 'う',
	え: 'う',
	お: 'う',
	わ: 'う',
	く: 'く',
	き: 'く',
	け: 'く',
	こ: 'く',
	が: 'ぐ',
	ぎ: 'ぐ',
	げ: 'ぐ',
	ご: 'ぐ',
	さ: 'す',
	し: 'す',
	せ: 'す',
	そ: 'す',
	た: 'つ',
	ち: 'つ',
	て: 'つ',
	と: 'つ',
	だ: 'づ',
	ぢ: 'づ',
	づ: 'づ',
	で: 'づ',
	ど: 'づ',
	な: 'ぬ',
	に: 'ぬ',
	ね: 'ぬ',
	の: 'ぬ',
	ば: 'ぶ',
	び: 'ぶ',
	べ: 'ぶ',
	ぼ: 'ぶ',
	ま: 'む',
	み: 'む',
	め: 'む',
	も: 'む',
	ら: 'る',
	り: 'る',
	れ: 'る',
	ろ: 'る',
};

const stemToDictionary = (stem: string): string[] => {
	if (!stem) return [];
	const results = new Set<string>([`${stem}る`]);
	const last = stem.slice(-1);
	const ending = godanDictionary[last];
	if (ending) results.add(`${stem.slice(0, -1)}${ending}`);
	return [...results];
};

const pastToDictionary: Record<string, string[]> = {
	って: ['う', 'つ', 'る'],
	った: ['う', 'つ', 'る'],
	んで: ['む', 'ぶ', 'ぬ'],
	んだ: ['む', 'ぶ', 'ぬ'],
	いて: ['く'],
	いた: ['く'],
	いで: ['ぐ'],
	いだ: ['ぐ'],
	して: ['す'],
	した: ['す'],
};

const dictionaryFromPast = (text: string): string[] => {
	for (const [suffix, endings] of Object.entries(pastToDictionary)) {
		if (!text.endsWith(suffix) || text.length <= suffix.length) continue;
		const stem = text.slice(0, -suffix.length);
		return endings.map((ending) => `${stem}${ending}`);
	}
	return [];
};

const dictionaryFromTe = (text: string): string[] => dictionaryFromPast(text.replace(/て$/, 'た').replace(/で$/, 'だ'));

export const japaneseTransforms: LanguageTransformDescriptor = {
	language: 'ja',
	conditions,
	transforms: {
		polite: {
			name: 'polite',
			description: 'polite form',
			rules: [
				regexInflection('ます', 'polite form', /^(.*)ます$/, (match) => stemToDictionary(match[1] ?? ''), [], ['masu']),
			],
		},
		politePast: {
			name: 'polite-past',
			description: 'polite past',
			rules: [
				regexInflection('ました', 'polite past', /^(.*)ました$/, (match) => stemToDictionary(`${match[1] ?? ''}ます`), [], ['masu']),
			],
		},
		negative: {
			name: 'negative',
			description: 'negative form',
			rules: [
				regexInflection('ない', 'negative form', /^(.*)ない$/, (match) => stemToDictionary(match[1] ?? ''), [], ['neg']),
			],
		},
		negativePast: {
			name: 'negative-past',
			description: 'negative past',
			rules: [
				suffixInflection('negative-past', 'negative past', 'なかった', 'ない', ['neg'], ['neg']),
			],
		},
		teForm: {
			name: 'te-form',
			description: 'て-form',
			rules: [
				regexInflection('te-form', 'て-form', /^(.*(?:って|って|んで|いて|いで|して|った|んだ|いた|いだ|した))$/, (match) => dictionaryFromTe(match[1] ?? ''), [], ['te']),
			],
		},
		progressive: {
			name: 'progressive',
			description: 'progressive form',
			rules: [
				suffixInflection('progressive', 'progressive', 'ている', 'て', [], ['te']),
				suffixInflection('progressive-polite', 'polite progressive', 'ています', 'て', [], ['te']),
			],
		},
		past: {
			name: 'past',
			description: 'past form',
			rules: [
				regexInflection('past', 'past form', /^(.*(?:って|った|んで|んだ|いて|いた|いで|いだ|して|した))$/, (match) => dictionaryFromPast(match[1] ?? ''), [], ['v5']),
			],
		},
	},
};
