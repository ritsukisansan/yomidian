export interface DeinflectionResult {
	term: string;
	reasons: string[];
}

interface Rule {
	match: string;
	reason: string;
}

const rules: Rule[] = [
	['ませんでした', 'polite negative past'], ['ません', 'polite negative'], ['ました', 'polite past'], ['ます', 'polite'],
	['なかった', 'negative past'], ['なければ', 'negative conditional'], ['なくて', 'negative connective'],
	['なくちゃ', 'contracted negative obligation'], ['なきゃ', 'contracted negative obligation'], ['ない', 'negative'],
	['たくなかった', 'negative desiderative past'], ['たくない', 'negative desiderative'], ['たかった', 'desiderative past'], ['たい', 'desiderative'],
	['ていました', 'polite progressive past'], ['でいました', 'polite progressive past'], ['ています', 'polite progressive'], ['でいます', 'polite progressive'],
	['ていた', 'past progressive'], ['でいた', 'past progressive'], ['ている', 'progressive'], ['でいる', 'progressive'],
	['ちゃった', 'contracted perfective past'], ['じゃった', 'contracted perfective past'], ['ちゃう', 'contracted perfective'], ['じゃう', 'contracted perfective'],
	['てしまった', 'perfective past'], ['でしまった', 'perfective past'], ['てしまう', 'perfective'], ['でしまう', 'perfective'],
	['させられた', 'causative passive past'], ['させられる', 'causative passive'], ['させた', 'causative past'], ['させる', 'causative'],
	['せた', 'causative past'], ['せる', 'causative'], ['られた', 'potential/passive past'], ['られる', 'potential/passive'],
	['れた', 'potential/passive past'], ['れる', 'potential/passive'], ['れば', 'conditional'], ['ろう', 'volitional'], ['よう', 'volitional'],
	['なさい', 'polite imperative'], ['て', 'て-form'], ['で', 'て-form'], ['た', 'past'], ['だ', 'past'], ['ば', 'conditional'], ['ろ', 'imperative'],
].map(([match, reason]) => ({ match, reason }));

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

const addStemCandidates = (results: Map<string, string[]>, stem: string, reason: string): void => {
	if (!stem) return;
	results.set(stem + 'る', [reason, 'ichidan candidate']);
	const last = stem.slice(-1);
	const ending = godanDictionary[last];
	if (ending) results.set(stem.slice(0, -1) + ending, [reason, 'godan candidate']);
};

export function deinflect(text: string, maxResults = 64): DeinflectionResult[] {
	const input = text.trim();
	if (!input) return [];
	const results = new Map<string, string[]>();
	results.set(input, ['dictionary form']);

	for (const rule of rules) {
		if (!input.endsWith(rule.match) || input.length <= rule.match.length) continue;
		const stem = input.slice(0, -rule.match.length);
		addStemCandidates(results, stem, rule.reason);
	}

	for (const [ending, forms] of godanPast) {
		for (const form of forms) {
			if (!input.endsWith(form) || input.length <= form.length) continue;
			results.set(input.slice(0, -form.length) + ending, ['godan conjugation']);
		}
	}

	const last = input.slice(-1);
	const ending = godanDictionary[last];
	if (ending) results.set(input.slice(0, -1) + ending, ['godan dictionary candidate']);

	return [...results.entries()].slice(0, maxResults).map(([term, reasons]) => ({ term, reasons }));
}
