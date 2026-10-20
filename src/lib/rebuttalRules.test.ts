import { describe, expect, it } from 'vitest';
import {
	canJudgeRebuttals,
	decidingVotes,
	pickRebuttalAnswerIds,
	rebuttalDrawEntries,
	resolveRebuttal
} from './rebuttalRules';

describe('canJudgeRebuttals', () => {
	it('stays closed after a single finished puzzle', () => {
		expect(canJudgeRebuttals(1, true)).toBe(false);
		expect(canJudgeRebuttals(0, true)).toBe(false);
	});

	it('stays closed until today is finished, even with older puzzles', () => {
		expect(canJudgeRebuttals(2, false)).toBe(false);
		expect(canJudgeRebuttals(8, false)).toBe(false);
	});

	it('opens once today is finished and an earlier puzzle exists', () => {
		expect(canJudgeRebuttals(2, true)).toBe(true);
	});
});

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

	it('stays open when a held row is left out of the ballot', () => {
		const ballots = decidingVotes(['yes', 'pending', 'skipped', 'pending']);
		expect(ballots).toEqual(['yes']);
		expect(resolveRebuttal('open', ballots)).toBe('open');
	});
});

describe('rebuttalDrawEntries', () => {
	it('lists a plain card once and repeats a today card, a yes, and a waiting author', () => {
		const entries = rebuttalDrawEntries([
			{ id: 'plain', fromToday: false, yeses: 0, authorWaiting: false },
			{ id: 'today', fromToday: true, yeses: 0, authorWaiting: false },
			{ id: 'yes', fromToday: false, yeses: 1, authorWaiting: false },
			{ id: 'waiting', fromToday: false, yeses: 0, authorWaiting: true }
		]);

		expect(entries.filter((entry) => entry.id === 'plain')).toHaveLength(1);
		expect(entries.filter((entry) => entry.id === 'today')).toHaveLength(2);
		expect(entries.filter((entry) => entry.id === 'yes')).toHaveLength(2);
		expect(entries.filter((entry) => entry.id === 'waiting')).toHaveLength(2);
	});
});
