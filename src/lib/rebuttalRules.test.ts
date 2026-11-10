import { describe, expect, it } from 'vitest';
import {
	canJudgeRebuttals,
	decidingVotes,
	isRebuttable,
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

describe('isRebuttable', () => {
	it('allows any judged answer below the point line', () => {
		expect(isRebuttable(0, 0.1)).toBe(true);
		expect(isRebuttable(0.2, null)).toBe(true);
		expect(isRebuttable(0.59, null)).toBe(true);
		expect(isRebuttable(0.6, 0.1)).toBe(false);
	});

	it('skips answers the grader never judged', () => {
		expect(isRebuttable(null, null)).toBe(false);
	});

	it('skips profane wording', () => {
		expect(isRebuttable(0.2, 0.6)).toBe(false);
		expect(isRebuttable(0.2, 0.59)).toBe(true);
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
