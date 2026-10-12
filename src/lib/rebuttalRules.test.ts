import { describe, expect, it } from 'vitest';
import { pickRebuttalAnswerIds, resolveRebuttal } from './rebuttalRules';

describe('pickRebuttalAnswerIds', () => {
	it('keeps the two highest scores above 0.40', () => {
		expect(
			pickRebuttalAnswerIds([
				{ answerId: 'under', yesProbability: 0.2, profaneProbability: 0.1 },
				{ answerId: 'high', yesProbability: 0.58, profaneProbability: 0.1 },
				{ answerId: 'edge', yesProbability: 0.4, profaneProbability: 0.1 },
				{ answerId: 'mid', yesProbability: 0.5, profaneProbability: 0.1 },
				{ answerId: 'third', yesProbability: 0.45, profaneProbability: 0.1 }
			])
		).toEqual(['high', 'mid']);
	});

	it('skips a point, the floor, and profane wording', () => {
		expect(
			pickRebuttalAnswerIds([
				{ answerId: 'point', yesProbability: 0.6, profaneProbability: 0.1 },
				{ answerId: 'floor', yesProbability: 0.4, profaneProbability: 0.1 },
				{ answerId: 'unscored', yesProbability: 0.55, profaneProbability: null },
				{ answerId: 'profane', yesProbability: 0.55, profaneProbability: 0.6 },
				{ answerId: 'ok', yesProbability: 0.41, profaneProbability: 0.59 }
			])
		).toEqual(['unscored', 'ok']);
	});
});

describe('resolveRebuttal', () => {
	it('closes when two votes agree', () => {
		expect(resolveRebuttal('open', ['yes', 'yes'])).toBe('yes');
		expect(resolveRebuttal('open', ['no', 'no'])).toBe('no');
	});

	it('stays open on a split', () => {
		expect(resolveRebuttal('open', ['yes', 'no'])).toBe('open');
		expect(resolveRebuttal('open', ['yes'])).toBe('open');
	});

	it('lets the third vote break a split', () => {
		expect(resolveRebuttal('open', ['yes', 'no', 'yes'])).toBe('yes');
		expect(resolveRebuttal('open', ['yes', 'no', 'no'])).toBe('no');
	});

	it('does not reopen a closed case', () => {
		expect(resolveRebuttal('yes', ['yes', 'yes', 'no'])).toBe('yes');
		expect(resolveRebuttal('no', ['no', 'no', 'yes'])).toBe('no');
	});
});
