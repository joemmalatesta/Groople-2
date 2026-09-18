import { describe, expect, it } from 'vitest';
import { addUtcDays, streakAfterPlay } from './playerStreak';

describe('addUtcDays', () => {
	it('crosses months', () => {
		expect(addUtcDays('2026-09-30', 1)).toBe('2026-10-01');
	});
});

describe('streakAfterPlay', () => {
	it('starts a streak on a scoring first play', () => {
		expect(streakAfterPlay({ lastPlayedOn: null, streak: 0, maxStreak: 0 }, '2026-09-17', true)).toEqual({
			lastPlayedOn: '2026-09-17',
			streak: 1,
			maxStreak: 1
		});
	});

	it('increments consecutive scoring days and tracks the max', () => {
		const next = streakAfterPlay(
			{ lastPlayedOn: '2026-09-17', streak: 1, maxStreak: 4 },
			'2026-09-18',
			true
		);
		expect(next).toEqual({ lastPlayedOn: '2026-09-18', streak: 2, maxStreak: 4 });
	});

	it('resets after a missed day or a zero', () => {
		expect(
			streakAfterPlay({ lastPlayedOn: '2026-09-16', streak: 5, maxStreak: 5 }, '2026-09-18', true)
		).toEqual({ lastPlayedOn: '2026-09-18', streak: 1, maxStreak: 5 });
		expect(
			streakAfterPlay({ lastPlayedOn: '2026-09-17', streak: 5, maxStreak: 5 }, '2026-09-18', false)
		).toEqual({ lastPlayedOn: '2026-09-18', streak: 0, maxStreak: 5 });
	});

	it('does not move if they already played this puzzle date', () => {
		expect(
			streakAfterPlay({ lastPlayedOn: '2026-09-17', streak: 3, maxStreak: 3 }, '2026-09-17', true)
		).toEqual({ lastPlayedOn: '2026-09-17', streak: 3, maxStreak: 3 });
	});
});
