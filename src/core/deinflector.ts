export interface DeinflectionResult {
	term: string;
	reasons: string[];
}

interface Rule {
	suffix: string;
	replacement: string;
	reason: string;
}

const rules: Rule[] = [
	{ suffix: 'ませんでした', replacement: 'る', reason: 'polite negative past' },
	{ suffix: 'ません', replacement: 'る', reason: 'polite negative' },
	{ suffix: 'ました', replacement: 'る', reason: 'polite past' },
	{ suffix: 'ます', replacement: 'る', reason: 'polite' },
	{ suffix: 'なかった', replacement: 'ない', reason: 'negative past' },
	{ suffix: 'なくて', replacement: 'ない', reason: 'negative connective' },
	{ suffix: 'なく', replacement: 'ない', reason: 'negative adverbial' },
	{ suffix: 'ない', replacement: 'る', reason: 'negative' },
	{ suffix: 'なかった', replacement: 'る', reason: 'negative past' },
	{ suffix: 'なきゃ', replacement: 'ない', reason: 'contracted negative conditional' },
	{ suffix: 'なければ', replacement: 'ない', reason: 'negative conditional' },
	{ suffix: 'なくちゃ', replacement: 'ない', reason: 'contracted negative obligation' },
	{ suffix: 'なきゃ', replacement: 'る', reason: 'contracted obligation' },
	{ suffix: 'たい', replacement: 'る', reason: 'desiderative' },
	{ suffix: 'たくない', replacement: 'る', reason: 'negative desiderative' },
	{ suffix: 'たかった', replacement: 'る', reason: 'past desiderative' },
	{ suffix: 'ている', replacement: 'る', reason: 'progressive' },
	{ suffix: 'でいる', replacement: 'る', reason: 'progressive' },
	{ suffix: 'ていた', replacement: 'る', reason: 'past progressive' },
	{ suffix: 'でいた', replacement: 'る', reason: 'past progressive' },
	{ suffix: 'ていない', replacement: 'る', reason: 'negative progressive' },
	{ suffix: 'でいない', replacement: 'る', reason: 'negative progressive' },
	{ suffix: 'ちゃう', replacement: 'る', reason: 'contracted perfective' },
	{ suffix: 'じゃう', replacement: 'る', reason: 'contracted perfective' },
	{ suffix: 'てしまう', replacement: 'る', reason: 'perfective' },
	{ suffix: 'でしまう', replacement: 'る', reason: 'perfective' },
	{ suffix: 'てしまった', replacement: 'る', reason: 'past perfective' },
	{ suffix: 'でしまった', replacement: 'る', reason: 'past perfective' },
	{ suffix: 'れば', replacement: 'る', reason: 'conditional' },
	{ suffix: 'れば', replacement: 'う', reason: 'conditional godan' },
	{ suffix: 'ろう', replacement: 'る', reason: 'volitional ichidan' },
	{ suffix: 'よう', replacement: 'る', reason: 'volitional' },
	{ suffix: 'られる', replacement: 'る', reason: 'potential/passive' },
	{ suffix: 'れる', replacement: 'る', reason: 'potential/passive' },
	{ suffix: 'させる', replacement: 'る', reason: 'causative' },
	{ suffix: 'せる', replacement: 'る', reason: 'causative' },
	{ suffix: 'させられる', replacement: 'る', reason: 'causative passive' },
	{ suffix: 'せられる', replacement: 'る', reason: 'causative passive' },
	{ suffix: 'て', replacement: 'る', reason: 'te-form' },
	{ suffix: 'で', replacement: 'る', reason: 'te-form' },
	{ suffix: 'た', replacement: 'る', reason: 'past' },
	{ suffix: 'だ', replacement: 'る', reason: 'past' },
	{ suffix: 'ば', replacement: 'る', reason: 'conditional' },
	{ suffix: 'う', replacement: 'る', reason: 'godan dictionary ending' },
	{ suffix: 'く', replacement: 'く', reason: 'godan dictionary ending' },
	{ suffix: 'ぐ', replacement: 'ぐ', reason: 'godan dictionary ending' },
	{ suffix: 'す', replacement: 'す', reason: 'godan dictionary ending' },
	{ suffix: 'つ', replacement: 'つ', reason: 'godan dictionary ending' },
	{ suffix: 'ぬ', replacement: 'ぬ', reason: 'godan dictionary ending' },
	{ suffix: 'ぶ', replacement: 'ぶ', reason: 'godan dictionary ending' },
	{ suffix: 'む', replacement: 'む', reason: 'godan dictionary ending' },
	{ suffix: 'る', replacement: 'る', reason: 'dictionary form' },
	{ suffix: 'よ', replacement: 'る', reason: 'imperative' },
	{ suffix: 'なさい', replacement: 'る', reason: 'polite imperative' },
];

const godan: Record<string, string[]> = {
	う: ['う', 'い', 'わ'],
	く: ['く', 'き', 'か'],
	ぐ: ['ぐ', 'ぎ', 'が'],
	す: ['す', 'し', 'さ'],
	つ: ['つ', 'ち', 'た'],
	ぬ: ['ぬ', 'に', 'な'],
	ぶ: ['ぶ', 'び', 'ば'],
	む: ['む', 'み', 'ま'],
	る: ['る', 'り', 'ら'],
};

function addCandidate(results: Map<string, string[]>, term: string, reason: string, reasons: string[]): void {
	if (!term || term.length === 0) return;
	const existing = results.get(term);
	const next = existing ? [...existing, ...reasons, reason] : [...reasons, reason];
	results.set(term, [...new Set(next)]);
}

export function deinflect(text: string, maxResults = 64): DeinflectionResult[] {
	const input = text.trim();
	if (!input) return [];
	const results = new Map<string, string[]>();
	addCandidate(results, input, 'dictionary form', []);
	const queue: Array<{ text: string; reasons: string[] }> = [{ text: input, reasons: [] }];
	const seen = new Set<string>([input]);

	while (queue.length > 0 && seen.size < maxResults * 8) {
		const current = queue.shift()!;
		for (const rule of rules) {
			if (!current.text.endsWith(rule.suffix) || current.text.length <= rule.suffix.length) continue;
			const stem = current.text.slice(0, -rule.suffix.length);
			let candidate = stem + rule.replacement;
			if (rule.replacement === 'る' && stem.length > 0) {
				const last = stem.slice(-1);
				for (const [ending, forms] of Object.entries(godan)) {
					if (forms.includes(last)) {
						const index = forms.indexOf(last);
						candidate = stem.slice(0, -1) + ending;
						if (index === 2) candidate = stem.slice(0, -1) + ending;
						break;
					}
				}
			}
			if (candidate === current.text || candidate.length === 0 || seen.has(candidate)) continue;
			const reasons = [...current.reasons, rule.reason];
			seen.add(candidate);
			addCandidate(results, candidate, rule.reason, current.reasons);
			queue.push({ text: candidate, reasons });
		}
	}

	return [...results.entries()]
		.slice(0, maxResults)
		.map(([term, reasons]) => ({ term, reasons }));
}
