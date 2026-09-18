import { describe, expect, it } from 'vitest';
import { histogramFromCounts, percentileLabel, percentileRank, includeScore } from './scoreboard';

describe('percentileRank', () => {
	it('is the share of today who scored lower', () => {
		const world = histogramFromCounts([
			{ score: 1, count: 4 },
			{ score: 3, count: 4 },
			{ score: 8, count: 2 }
		]);
		expect(percentileRank(world, 3)).toBe(40);
		expect(percentileLabel(40)).toBe('40th');
		expect(percentileLabel(1)).toBe('1st');
		expect(percentileLabel(12)).toBe('12th');
	});
});

describe('includeScore', () => {
	it('adds today when the bucket is empty', () => {
		const world = histogramFromCounts([{ score: 4, count: 1 }]);
		expect(includeScore(world, 3)[3]).toBe(1);
		expect(includeScore(world, 3)[4]).toBe(1);
	});

	it('does not double-count a score that is already present', () => {
		const world = histogramFromCounts([{ score: 3, count: 2 }]);
		expect(includeScore(world, 3)[3]).toBe(2);
	});
});
