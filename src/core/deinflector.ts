export interface DeinflectionResult {
	term: string;
	reasons: string[];
}

interface Rule {
	match: string;
	replace: string;
	reason: string;
}

const rules: Rule[] = [
	{ match: 'ませんでした', replace: 'る', reason: 'polite negative past' },
	{ match: 'ません', replace: 'る', reason: 'polite negative' },
	{ match: 'ました', replace: 'る', reason: 'polite past' },
	{ match: 'ます', replace: 'る', reason: 'polite' },
	{ match: 'なかった', replace: 'る', reason: 'negative past' },
	{ match: 'なければ', replace: 'る', reason: 'negative conditional' },
	{ match: 'なくて', replace: 'る', reason: 'negative connective' },
	{ match: 'なくちゃ', replace: 'る', reason: 'contracted negative obligation' },
	{ match: 'なきゃ', replace: 'る', reason: 'contracted negative obligation' },
	{ match: 'ない', replace: 'る', reason: 'negative' },
	{ match: 'たくなかった', replace: 'る', reason: 'negative desiderative past' },
	{ match: 'たくない', replace: 'る', reason: 'negative desiderative' },
	{ match: 'たかった', replace: 'る', reason: 'desiderative past' },
	{ match: 'たい', replace: 'る', reason: 'desiderative' },
	{ match: 'ていました', replace: 'る', reason: 'polite progressive past' },
	{ match: 'でいました', replace: 'る', reason: 'polite progressive past' },
	{ match: 'ています', replace: 'る', reason: 'polite progressive' },
	{ match: 'でいます', replace: 'る', reason: 'polite progressive' },
	{ match: 'ていた', replace: 'る', reason: 'past progressive' },
	{ match: 'でいた', replace: 'る', reason: 'past progressive' },
	{ match: 'ている', replace: 'る', reason: 'progressive' },
	{ match: 'でいる', replace: 'る', reason: 'progressive' },
	{ match: 'ちゃった', replace: 'る', reason: 'contracted perfective past' },
	{ match: 'じゃった', replace: 'る', reason: 'contracted perfective past' },
	{ match: 'ちゃう', replace: 'る', reason: 'contracted perfective' },
	{ match: 'じゃう', replace: 'る', reason: 'contracted perfective' },
	{ match: 'てしまった', replace: 'る', reason: 'perfective past' },
	{ match: 'でしまった', replace: 'る', reason: 'perfective past' },
	{ match: 'てしまう', replace: 'る', reason: 'perfective' },
	{ match: 'でしまう', replace: 'る', reason: 'perfective' },
	{ match: 'られた', replace: 'る', reason: 'potential/passive past' },
	{ match: 'られる', replace: 'る', reason: 'potential/passive' },
	{ match: 'れた', replace: 'る', reason: 'potential/passive past' },
	{ match: 'れる', replace: 'る', reason: 'potential/passive' },
	{ match: 'させられた', replace: 'る', reason: 'causative passive past' },
	{ match: 'させられる', replace: 'る', reason: 'causative passive' },
	{ match: 'させた', replace: 'る', reason: 'causative past' },
	{ match: 'させる', replace: 'る', reason: 'causative' },
	{ match: 'せた', replace: 'る', reason: 'causative past' },
	{ match: 'せる', replace: 'る', reason: 'causative' },
	{ match: 'れば', replace: 'る', reason: 'conditional' },
	{ match: 'ろう', replace: 'る', reason: 'volitional' },
	{ match: 'よう', replace: 'る', reason: 'volitional' },
	{ match: 'なさい', replace: 'る', reason: 'polite imperative' },
	{ match: 'て', replace: 'る', reason: 'て-form' },
	{ match: 'で', replace: 'る', reason: 'て-form' },
	{ match: 'た', replace: 'る', reason: 'past' },
	{ match: 'だ', replace: 'る', reason: 'past' },
	{ match: 'ば', replace: 'る', reason: 'conditional' },
	{ match: 'ろ', replace: 'る', reason: 'imperative' },
];

const godanDictionary: Record<string, string> = {
	わ: 'う', い: 'う', え: 'う', お: 'う',
	か: 'く', き: 'く', け: 'く', こ: 'く',
	が: 'ぐ', ぎ: 'ぐ', げ: 'ぐ', ご: 'ぐ',
	さ: 'す', し: 'す', せ: 'す', そ: 'す',
	た: 'つ', ち: 'つ', て: 'つ', と: 'つ',
	な: 'ぬ', に: 'ぬ', ね: 'ぬ', の: 'ぬ',
	ば: 'ぶ', び: 'ぶ', べ: 'ぶ', ぼ: 'ぶ',
	ま: 'む', み: 'む', め: 'む', も: 'む',
	ら: 'る', り: 'る', れ: 'る', ろ: 'る',
};

const godanPast: Array<[string, string[]]> = [
	['う', ['って', 'った']], ['つ', ['って', 'った']], ['る', ['って', 'った']],
	['む', ['んで', 'んだ']], ['ぶ', ['んで', 'んだ']], ['ぬ', ['んで', 'んだ']],
	['く', ['いて', 'いた']], ['ぐ', ['いで', 'いだ']], ['す', ['して', 'した']],
];

export function deinflect(text: string, maxResults = 64): DeinflectionResult[] {
	const input = text.trim();
	if (!input) return [];
	const results = new Map<string, string[]>();
	results.set(input, ['dictionary form']);

	for (const rule of rules) {
		if (!input.endsWith(rule.match) || input.length <= rule.match.length) continue;
		const candidate = input.slice(0, -rule.match.length) + rule.replace;
		if (candidate !== input) results.set(candidate, [rule.reason]);
	}

	for (const [ending, forms] of godanPast) {
		for (const form of forms) {
			if (!input.endsWith(form) || input.length <= form.length) continue;
			results.set(input.slice(0, -form.length) + ending, ['godan conjugation']);
		}
	}

	const last = input.slice(-1);
	const ending = godanDictionary[last];
	if (ending) results.set(input.slice(0, -1) + ending, ['godan conjugation']);

	return [...results.entries()].slice(0, maxResults).map(([term, reasons]) => ({ term, reasons }));
}
