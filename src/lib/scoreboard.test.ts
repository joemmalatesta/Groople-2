import { describe, expect, it } from 'vitest';
import { histogramFromCounts, percentileLabel, percentileRank } from './scoreboard';

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
