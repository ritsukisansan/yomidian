export interface TransformCondition {
	name: string;
	isDictionaryForm: boolean;
	subConditions?: string[];
}

export interface TransformResult {
	term: string;
	condition: string | null;
	reasons: string[];
}

export interface TransformRule {
	name: string;
	description: string;
	conditionsIn: string[];
	conditionsOut: string[];
	apply(text: string): string[];
}

export interface LanguageTransformDescriptor {
	language: string;
	conditions: Record<string, TransformCondition>;
	transforms: Record<string, {
		name: string;
		description: string;
		rules: TransformRule[];
	}>;
}

export function suffixInflection(
	name: string,
	description: string,
	suffix: string,
	replacement: string,
	conditionsIn: string[],
	conditionsOut: string[],
): TransformRule {
	return {
		name,
		description,
		conditionsIn,
		conditionsOut,
		apply(text) {
			if (!text.endsWith(suffix) || text.length <= suffix.length) return [];
			return [text.slice(0, -suffix.length) + replacement];
		},
	};
}

export function regexInflection(
	name: string,
	description: string,
	pattern: RegExp,
	replacer: (match: RegExpExecArray) => string | string[],
	conditionsIn: string[],
	conditionsOut: string[],
): TransformRule {
	return {
		name,
		description,
		conditionsIn,
		conditionsOut,
		apply(text) {
			const match = pattern.exec(text);
			if (!match) return [];
			const result = replacer(match);
			return Array.isArray(result) ? result : [result];
		},
	};
}

function conditionMatches(
	condition: string | null,
	requested: string[],
	conditions: Record<string, TransformCondition>,
): boolean {
	if (requested.length === 0 || condition === null) return true;
	for (const requestedCondition of requested) {
		if (requestedCondition === condition) return true;
		if (conditions[requestedCondition]?.subConditions?.includes(condition)) return true;
	}
	return false;
}

function conditionCanBeDictionaryForm(
	condition: string | null,
	conditions: Record<string, TransformCondition>,
): boolean {
	return condition === null || conditions[condition]?.isDictionaryForm === true;
}

export class LanguageTransformer {
	private descriptors = new Map<string, LanguageTransformDescriptor>();

	addDescriptor(descriptor: LanguageTransformDescriptor): void {
		this.descriptors.set(descriptor.language, descriptor);
	}

	transform(language: string, source: string, maxResults = 64): TransformResult[] {
		const descriptor = this.descriptors.get(language);
		if (!descriptor || !source.trim()) return [];

		interface Candidate {
			term: string;
			condition: string | null;
			reasons: string[];
		}

		const results = new Map<string, TransformResult>();
		const queue: Candidate[] = [{ term: source.trim(), condition: null, reasons: [] }];
		const seen = new Set<string>([`${source.trim()}\u0000`]);

		while (queue.length > 0 && results.size < maxResults) {
			const current = queue.shift()!;
			const currentKey = `${current.term}\u0000${current.condition ?? ''}`;
			if (!results.has(currentKey)) {
				results.set(currentKey, {
					term: current.term,
					condition: current.condition,
					reasons: current.reasons,
				});
			}

			for (const transform of Object.values(descriptor.transforms)) {
				for (const rule of transform.rules) {
					if (!conditionMatches(current.condition, rule.conditionsIn, descriptor.conditions)) continue;
					for (const term of rule.apply(current.term)) {
						if (!term || term === current.term) continue;
						const nextReasons = [...current.reasons, rule.description];
						const nextConditions = rule.conditionsOut.length > 0 ? rule.conditionsOut : [null];
						for (const nextCondition of nextConditions) {
							const key = `${term}\u0000${nextCondition ?? ''}`;
							if (seen.has(key)) continue;
							seen.add(key);
							queue.push({ term, condition: nextCondition, reasons: nextReasons });
						}
					}
				}
			}
		}

		return [...results.values()].filter((result) =>
			conditionCanBeDictionaryForm(result.condition, descriptor.conditions),
		);
	}
}
